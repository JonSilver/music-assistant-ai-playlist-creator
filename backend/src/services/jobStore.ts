/**
 * In-memory job store for tracking playlist generation jobs
 */

import type { PlaylistGenerationJob, JobProgressUpdate } from "../types/jobs.js";

export class JobStore {
    private jobs = new Map<string, PlaylistGenerationJob>();
    private listeners = new Map<string, Set<(update: JobProgressUpdate) => void>>();

    createJob(
        jobId: string,
        prompt: string,
        providerPreference?: string,
        webhookUrl?: string
    ): PlaylistGenerationJob {
        const job: PlaylistGenerationJob = {
            jobId,
            status: "pending",
            prompt,
            providerPreference,
            webhookUrl,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.jobs.set(jobId, job);
        return job;
    }

    getJob(jobId: string): PlaylistGenerationJob | undefined {
        return this.jobs.get(jobId);
    }

    updateJob(jobId: string, update: Partial<PlaylistGenerationJob>): void {
        const job = this.jobs.get(jobId);
        if (job === undefined) 
            return;
        

        Object.assign(job, { ...update, updatedAt: new Date() });
        this.jobs.set(jobId, job);

        // Notify listeners
        this.notifyListeners(jobId, {
            jobId,
            status: job.status,
            tracks: job.tracks,
            totalTracks: job.totalTracks,
            matchedTracks: job.matchedTracks,
            playlistUrl: job.playlistUrl,
            error: job.error
        });
    }

    addListener(jobId: string, callback: (update: JobProgressUpdate) => void): void {
        if (!this.listeners.has(jobId)) 
            this.listeners.set(jobId, new Set());
        
        const listeners = this.listeners.get(jobId);
        if (listeners !== undefined) 
            listeners.add(callback);
        
    }

    removeListener(jobId: string, callback: (update: JobProgressUpdate) => void): void {
        const listeners = this.listeners.get(jobId);
        if (listeners !== undefined) {
            listeners.delete(callback);
            if (listeners.size === 0) 
                this.listeners.delete(jobId);
            
        }
    }

    private notifyListeners(jobId: string, update: JobProgressUpdate): void {
        const listeners = this.listeners.get(jobId);
        if (listeners !== undefined) 
            listeners.forEach(callback => callback(update));
        
    }

    // Cleanup old completed/failed jobs (older than 1 hour)
    cleanup(): void {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        for (const [jobId, job] of this.jobs.entries()) 
            if (
                (job.status === "completed" || job.status === "failed") &&
                job.updatedAt < oneHourAgo
            ) {
                this.jobs.delete(jobId);
                this.listeners.delete(jobId);
            }
        
    }
}

export const jobStore = new JobStore();

// Cleanup old jobs every 15 minutes
setInterval(
    () => {
        jobStore.cleanup();
    },
    15 * 60 * 1000
);
