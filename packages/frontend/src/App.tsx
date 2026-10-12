import React, { useEffect, useState, useCallback } from 'react';
import {
  TaskRecord,
  HealthInfo,
  fetchHealth,
  fetchTasks,
  fetchTask,
  createTask,
  abortTask,
  resolveHold,
  subscribeToTaskEvents,
} from './api/client';
import { Sidebar } from './components/Sidebar';
import { TaskWorkspace } from './components/TaskWorkspace';

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load health and initial task list
  const loadInitialData = useCallback(async () => {
    try {
      const [h, t] = await Promise.all([fetchHealth(), fetchTasks()]);
      setHealth(h);
      setTasks(t);
      if (t.length > 0 && !activeTaskId) {
        setActiveTaskId(t[0].id);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  }, [activeTaskId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Active task object
  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  // Active subtask agent
  const currentAgent = activeTask?.subtasks.find((s) => s.status === 'in_progress')?.agent;

  // Real-time SSE subscription for the active task
  useEffect(() => {
    if (!activeTaskId) return;

    const unsubscribe = subscribeToTaskEvents(
      activeTaskId,
      (updatedTask) => {
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        );
      },
      (newEvent) => {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === activeTaskId) {
              // Avoid duplicate event
              if (t.events.some((e) => e.id === newEvent.id)) return t;
              return { ...t, events: [...t.events, newEvent] };
            }
            return t;
          })
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTaskId]);

  // Handle new task submission
  const handleCreateTask = async (prompt: string) => {
    setIsLoading(true);
    try {
      const newTask = await createTask(prompt);
      setTasks((prev) => [newTask, ...prev]);
      setActiveTaskId(newTask.id);
    } catch (err) {
      console.error('Failed to submit task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle aborting task
  const handleAbortTask = async (taskId: string) => {
    try {
      await abortTask(taskId);
      const updated = await fetchTask(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Failed to abort task:', err);
    }
  };

  // Handle resolving hold decisions (Approve / Reject)
  const handleResolveHold = async (delegationId: string, approved: boolean) => {
    if (!activeTaskId) return;
    try {
      await resolveHold(activeTaskId, delegationId, approved);
      const updated = await fetchTask(activeTaskId);
      setTasks((prev) => prev.map((t) => (t.id === activeTaskId ? updated : t)));
    } catch (err) {
      console.error('Failed to resolve hold:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-pebble-950 font-sans text-pebble-100">
      <Sidebar
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelectTask={(id) => setActiveTaskId(id)}
        onNewTask={() => setActiveTaskId(null)}
        health={health}
        currentAgent={currentAgent}
      />
      <TaskWorkspace
        task={activeTask}
        onSubmitTask={handleCreateTask}
        onAbortTask={handleAbortTask}
        onResolveHold={handleResolveHold}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;
