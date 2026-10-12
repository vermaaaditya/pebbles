import { FastifyPluginAsync } from 'fastify';
import { TaskStore } from '../store/task-store.js';
import { PebblesOrchestrator } from '../orchestration/orchestrator.js';
import { IAuthorizationProvider } from '../authorization/types.js';

export interface TasksRouteDeps {
  taskStore: TaskStore;
  orchestrator: PebblesOrchestrator;
  authProvider: IAuthorizationProvider;
}

export function createTasksRoutes(deps: TasksRouteDeps): FastifyPluginAsync {
  return async (fastify) => {
    // 1. Create and trigger new task
    fastify.post<{ Body: { prompt: string } }>('/api/tasks', async (req, reply) => {
      const { prompt } = req.body || {};
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return reply.status(400).send({ error: 'Prompt is required.' });
      }

      const task = deps.taskStore.createTask(prompt.trim());

      // Start orchestration loop asynchronously
      deps.orchestrator.executeTask(task.id).catch((err) => {
        console.error(`[Orchestrator] Execution failed for task ${task.id}:`, err);
      });

      return reply.status(201).send(task);
    });

    // 2. List all tasks
    fastify.get('/api/tasks', async () => {
      return deps.taskStore.getAllTasks();
    });

    // 3. Get single task by ID
    fastify.get<{ Params: { id: string } }>('/api/tasks/:id', async (req, reply) => {
      const task = deps.taskStore.getTask(req.params.id);
      if (!task) {
        return reply.status(404).send({ error: 'Task not found.' });
      }
      return task;
    });

    // 4. Abort task
    fastify.post<{ Params: { id: string } }>('/api/tasks/:id/abort', async (req, reply) => {
      const success = deps.orchestrator.abortTask(req.params.id);
      return { success, taskId: req.params.id };
    });

    // 5. Resolve held action
    fastify.post<{
      Params: { id: string };
      Body: { delegationId: string; approved: boolean };
    }>('/api/tasks/:id/hold', async (req, reply) => {
      const { delegationId, approved } = req.body || {};
      if (!delegationId) {
        return reply.status(400).send({ error: 'delegationId is required.' });
      }

      const handled = await deps.authProvider.handleHold(delegationId, Boolean(approved));
      return { handled, delegationId, approved: Boolean(approved) };
    });

    // 6. Server-Sent Events stream for real-time task activity
    fastify.get<{ Params: { id: string } }>('/api/tasks/:id/events', async (req, reply) => {
      const taskId = req.params.id;
      const initialTask = deps.taskStore.getTask(taskId);
      if (!initialTask) {
        return reply.status(404).send({ error: 'Task not found.' });
      }

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');

      // Send initial task snapshot
      reply.raw.write(`event: snapshot\ndata: ${JSON.stringify(initialTask)}\n\n`);

      const unsubscribe = deps.taskStore.subscribe((updatedTask, newEvent) => {
        if (updatedTask.id === taskId) {
          if (newEvent) {
            reply.raw.write(`event: event\ndata: ${JSON.stringify(newEvent)}\n\n`);
          }
          reply.raw.write(`event: task_update\ndata: ${JSON.stringify(updatedTask)}\n\n`);
        }
      });

      req.raw.on('close', () => {
        unsubscribe();
      });
    });
  };
}
