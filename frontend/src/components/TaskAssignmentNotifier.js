import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 8000;
let alertAudioContext = null;

const getAlertAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!alertAudioContext || alertAudioContext.state === 'closed') {
    alertAudioContext = new AudioContext();
  }

  return alertAudioContext;
};

const unlockTaskAlertAudio = () => {
  const audio = getAlertAudioContext();
  if (audio?.state === 'suspended') audio.resume().catch(() => {});
};

const playTaskAlert = () => {
  const audio = getAlertAudioContext();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume().catch(() => {});

  const master = audio.createGain();
  master.gain.value = 0.85;
  master.connect(audio.destination);

  const ring = (frequency, start, duration) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime + start);
    gain.gain.setValueAtTime(0.0001, audio.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.9, audio.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + duration);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(audio.currentTime + start);
    oscillator.stop(audio.currentTime + start + duration + 0.03);
  };

  ring(880, 0, 0.22);
  ring(1175, 0.26, 0.22);
  ring(880, 0.52, 0.22);
  ring(1568, 0.78, 0.34);

  window.setTimeout(() => master.disconnect(), 1500);
};

const notifyBrowser = (task) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification('New task assigned', {
    body: task?.title ? `${task.title}` : 'You have a new task.',
    tag: `task-${task?._id || Date.now()}`,
  });
};

export default function TaskAssignmentNotifier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const knownTaskIds = useRef(new Set());
  const initialized = useRef(false);
  const [latestTask, setLatestTask] = useState(null);

  useEffect(() => {
    const requestPermission = () => {
      unlockTaskAlertAudio();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      window.removeEventListener('pointerdown', requestPermission);
      window.removeEventListener('keydown', requestPermission);
    };

    window.addEventListener('pointerdown', requestPermission);
    window.addEventListener('keydown', requestPermission);

    return () => {
      window.removeEventListener('pointerdown', requestPermission);
      window.removeEventListener('keydown', requestPermission);
    };
  }, []);

  useEffect(() => {
    if (user?.role !== 'member') {
      knownTaskIds.current = new Set();
      initialized.current = false;
      setLatestTask(null);
      return undefined;
    }

    let cancelled = false;

    const checkForAssignedTasks = async () => {
      try {
        const { data } = await api.get('/tasks');
        if (cancelled) return;

        const tasks = data.tasks || [];
        const incomingIds = new Set(tasks.map((task) => task._id));

        if (!initialized.current) {
          knownTaskIds.current = incomingIds;
          initialized.current = true;
          return;
        }

        const newTasks = tasks.filter((task) => !knownTaskIds.current.has(task._id));
        knownTaskIds.current = incomingIds;

        if (newTasks.length > 0) {
          const newestTask = newTasks[0];
          setLatestTask(newestTask);
          playTaskAlert();
          notifyBrowser(newestTask);
          window.setTimeout(() => setLatestTask(null), 9000);
        }
      } catch (err) {
        if (err.response?.status !== 401) console.error('Task notification check failed:', err);
      }
    };

    checkForAssignedTasks();
    const intervalId = window.setInterval(checkForAssignedTasks, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user]);

  if (!latestTask || user?.role !== 'member') return null;

  return (
    <div className="task-notification" role="status">
      <div className="task-notification-mark">!</div>
      <div className="task-notification-copy">
        <div className="task-notification-title">New task assigned</div>
        <div className="task-notification-text">{latestTask.title}</div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/tasks/${latestTask._id}`)}>
        Open
      </button>
    </div>
  );
}
