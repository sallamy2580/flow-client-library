import {invariant} from "@onflow/util-invariant"
import {httpRequest as defaultHttpRequest} from "./http-request.js"

async function sendGetBlockHeaderByIDRequest(ix, context, opts) {
  const httpRequest = opts.httpRequest || defaultHttpRequest

  const res = await httpRequest({
    hostname: opts.node,
    path: `/blocks/${ix.block.id}`,
    method: "GET",
    body: null
  })

  return constructResponse(ix, context, res)
}

async function sendGetBlockHeaderByHeightRequest(ix, context, opts) {
  const httpRequest = opts.httpRequest || defaultHttpRequest

  const res = await httpRequest({
    hostname: opts.node,
    path: `/blocks?height=${ix.block.height}`,
    method: "GET",
    body: null
  })

  return constructResponse(ix, context, res)
}

async function sendGetLatestBlockHeaderRequest(ix, context, opts) {
  const httpRequest = opts.httpRequest || defaultHttpRequest

  const res = await httpRequest({
    hostname: opts.node,
    path: `/blocks?height=sealed`,
    method: "GET",
    body: null
  })

  return constructResponse(ix, context, res)
}

function constructResponse(ix, context, res) {
  // const blockHeader = res.getBlock()

  const ret = context.response()
  ret.tag = ix.tag
  ret.blockHeader = {
    id: res.header.id,
    parentId: res.header.parent_id,
    height: res.header.height,
    timestamp: res.header.timestamp,
    parentVoterSignature: res.header.parent_voter_signature, // NEW IN REST API!
  }

  return ret
}

export async function sendGetBlockHeader(ix, context = {}, opts = {}) {
  invariant(opts.node, `SDK Send Get Block Header Error: opts.node must be defined.`)
  invariant(context.response, `SDK Send Get Block Header Error: context.response must be defined.`)

  ix = await ix

  const interactionHasBlockID = ix.block.id !== null
  const interactionHasBlockHeight = ix.block.height !== null

  if (interactionHasBlockID) {
    return await sendGetBlockHeaderByIDRequest(ix, context, opts)
  } else if (interactionHasBlockHeight) {
    return await sendGetBlockHeaderByHeightRequest(ix, context, opts)
  } else {
    return await sendGetLatestBlockHeaderRequest(ix, context, opts)
  }
}
