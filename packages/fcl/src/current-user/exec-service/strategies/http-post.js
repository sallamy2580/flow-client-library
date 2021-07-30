import {fetchService} from "./utils/fetch-service"
import {normalizePollingResponse} from "../../normalize/polling-response"
import {frame} from "./utils/frame"
import {poll} from "./utils/poll"
import {execLocal} from "../exec-local"

export async function execHttpPost(service, signable, opts = {}) {
  signable.data = service.data
  const resp = await fetchService(service, {
    data: signable,
  }).then(normalizePollingResponse)

  if (resp.status === "APPROVED") {
    return resp.data
  } else if (resp.status === "DECLINED") {
    throw new Error(`Declined: ${resp.reason || "No reason supplied."}`)
  } else if (resp.status === "PENDING") {
    var canContinue = true
    const [_, unmount] = await execLocal(resp.local)

    const closeFrame = () => {
      try {
        unmount()
        canContinue = false
      } catch (error) {
        console.error("Frame Close Error", error)
      }
    }

    return poll(resp.updates, () => canContinue)
      .then(serviceResponse => {
        closeFrame()
        return serviceResponse
      })
      .catch(error => {
        console.error(error)
        closeFrame()
        throw error
      })
  } else {
    console.error(`Auto Decline: Invalid Response`, {service, resp})
    throw new Error(`Auto Decline: Invalid Response`)
  }
}
