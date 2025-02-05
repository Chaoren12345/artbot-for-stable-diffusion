import { appInfoStore } from 'store/appStore'
import { userInfoStore } from 'store/userStore'
import { JobStatus } from 'types'
import { isAppActive } from 'utils/appUtils'
import { checkCurrentJob, sendJobToApi } from 'utils/imageCache'
import { sleep } from 'utils/sleep'
import {
  MAX_CONCURRENT_JOBS_ANON,
  MAX_CONCURRENT_JOBS_USER,
  POLL_COMPLETED_JOBS_INTERVAL
} from '_constants'
import { getAllPendingJobs, getPendingJobsTimestamp } from './pendingJobsCache'
import AppSettings from 'models/AppSettings'

let MAX_JOBS = MAX_CONCURRENT_JOBS_ANON
let pendingJobs: Array<any> = []
let pendingJobsUpdatedTimestamp = 0
let enableDebugLogs = false

export const getPendingJobsFromCache = () => {
  return [...pendingJobs]
}

// Optimization hack?
// Periodically fetch latest pending jobs from database
// This call ensures it only happens one time (at a set interval)
export const fetchPendingImageJobs = async () => {
  if (pendingJobsUpdatedTimestamp !== getPendingJobsTimestamp()) {
    pendingJobsUpdatedTimestamp = getPendingJobsTimestamp()

    const jobs = getAllPendingJobs()
    pendingJobs = [...jobs]
  }
}

const checkMultiPendingJobs = async () => {
  if (typeof window === 'undefined') {
    return
  }

  if (pendingJobs.length === 0) {
    return
  }

  if (!isAppActive()) {
    return
  }

  const queued = pendingJobs.filter((job: { jobStatus: JobStatus }) => {
    if (job && job.jobStatus) {
      return job.jobStatus === JobStatus.Queued
    }
  })

  const processing = pendingJobs.filter((job: { jobStatus: JobStatus }) => {
    if (job && job.jobStatus) {
      return job.jobStatus === JobStatus.Processing
    }
  })

  const processingOrQueued = [...processing, ...queued]

  const limitCheck = processingOrQueued.slice(MAX_JOBS * -1)

  for (const idx in limitCheck) {
    const jobDetails = limitCheck[idx]
    await checkCurrentJob(jobDetails)
    await sleep(300)
  }
}

const createImageJobs = async () => {
  if (typeof window === 'undefined') {
    return
  }

  if (pendingJobs.length === 0) {
    return
  }

  if (appInfoStore.state.storageQuotaLimit) {
    if (enableDebugLogs)
      console.log(
        `pendingJobsController: Unable to request image. Storage Quota limit is full.`
      )
    return
  }

  if (!isAppActive()) {
    if (enableDebugLogs) console.log(`pendingJobsController: App is not active`)
    return
  }

  if (AppSettings.get('pauseJobQueue')) {
    if (enableDebugLogs) console.log(`pendingJobsController: job queue paused`)
    return
  }

  if (userInfoStore.state.loggedIn) {
    MAX_JOBS = MAX_CONCURRENT_JOBS_USER
  }

  const queued = pendingJobs.filter((job: { jobStatus: JobStatus }) => {
    if (job && job.jobStatus) {
      return job.jobStatus === JobStatus.Queued
    }
  })

  const processing = pendingJobs.filter((job: { jobStatus: JobStatus }) => {
    if (job && job.jobStatus) {
      return job.jobStatus === JobStatus.Processing
    }
  })

  const processingOrQueued = [...processing, ...queued]

  if (enableDebugLogs)
    console.log(`createImageJobs / processingOrQueued:`, processingOrQueued)

  if (processingOrQueued.length < MAX_JOBS) {
    const waitingJobs = pendingJobs.filter((job: { jobStatus: JobStatus }) => {
      if (job && job.jobStatus) {
        return job.jobStatus === JobStatus.Waiting
      }
    })

    const [nextJobParams] = waitingJobs

    if (enableDebugLogs) console.log(`nextJobParams:`, nextJobParams)

    if (nextJobParams) {
      await sendJobToApi(nextJobParams)
      await fetchPendingImageJobs() // Update pending jobs queue
    }
  }
}

export const updatePendingJobs = async () => {
  await fetchPendingImageJobs()
  await sleep(250)
  updatePendingJobs()
}

// Monitors pending jobs db to create new jobs
export const createPendingJobInterval = async () => {
  await fetchPendingImageJobs()
  createImageJobs()
  await sleep(10)
  createPendingJobInterval()
}

export const pendingJobCheckInterval = async () => {
  await checkMultiPendingJobs()
  await sleep(POLL_COMPLETED_JOBS_INTERVAL)
  pendingJobCheckInterval()
}

export const initPendingJobService = () => {
  updatePendingJobs()
  pendingJobCheckInterval()
  createPendingJobInterval()
}

const toggleLogs = () => {
  if (enableDebugLogs) {
    enableDebugLogs = false
  } else {
    enableDebugLogs = true
  }
}

const initWindow = () => {
  if (typeof window !== 'undefined') {
    if (!window._artbot) window._artbot = {}
    window._artbot.getAllPendingJobsFromController = getAllPendingJobs
    window._artbot.togglePendingJobsControllerLogs = toggleLogs
  }
}

initWindow()
