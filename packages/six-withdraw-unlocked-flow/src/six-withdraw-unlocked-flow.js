import * as sdk from "@onflow/sdk"
import * as t from "@onflow/types"
import {config} from "@onflow/config"

const Deps = {
    LOCKEDTOKENADDRESS: "0xLOCKEDTOKENADDRESS",
    FUNGIBLETOKENADDRESS: "0xFUNGIBLETOKENADDRESS",
    FLOWTOKENADDRESS: "0xFLOWTOKENADDRESS",
}

const Env = {
    local: {
        [Deps.LOCKEDTOKENADDRESS]: "0x0",
        [Deps.FUNGIBLETOKENADDRESS]: "0x0",
        [Deps.FLOWTOKENADDRESS]: "0x0",
    },
    testnet: {
        [Deps.LOCKEDTOKENADDRESS]: "0x95e019a17d0e23d7",
        [Deps.FUNGIBLETOKENADDRESS]: "0x9a0766d93b6608b7",
        [Deps.FLOWTOKENADDRESS]: "0x7e60df042a9c0868",
    },
    mainnet: {
        [Deps.LOCKEDTOKENADDRESS]: "0x8d0e87b65159ae63",
        [Deps.FUNGIBLETOKENADDRESS]: "0xf233dcee88fe0abe",
        [Deps.FLOWTOKENADDRESS]: "0x1654653399040a61",
    }
}

export const TITLE = "Withdraw Unlocked Tokens"
export const DESCRIPTION = "Withdraw Unlocked Tokens to an authorizers account."
export const VERSION = "0.0.1"
export const HASH = "a2146e3e6e7718779ce59376b88760c154d82b7d132fe2c377114ec7cf434e7b"
export const CODE = 
`import FungibleToken from 0xFUNGIBLETOKENADDRESS
import FlowToken from 0xFLOWTOKENADDRESS
import LockedTokens from 0xLOCKEDTOKENADDRESS

transaction(amount: UFix64) {

    let holderRef: &LockedTokens.TokenHolder
    let vaultRef: &FlowToken.Vault

    prepare(account: AuthAccount) {
        self.holderRef = account.borrow<&LockedTokens.TokenHolder>(from: LockedTokens.TokenHolderStoragePath)
            ?? panic("Could not borrow a reference to TokenHolder")

        self.vaultRef = account.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow flow token vault ref")
    }

    execute {
        self.vaultRef.deposit(from: <-self.holderRef.withdraw(amount: amount))
    }
}
`

export const template = async ({ proposer, authorization, payer, amount = ""}) => {
    const env = await config().get("env", "mainnet")
    let code = CODE.replace(Deps.LOCKEDTOKENADDRESS, Env[env][Deps.LOCKEDTOKENADDRESS])
    code = code.replace(Deps.FUNGIBLETOKENADDRESS, Env[env][Deps.FUNGIBLETOKENADDRESS])
    code = code.replace(Deps.FLOWTOKENADDRESS, Env[env][Deps.FLOWTOKENADDRESS])

    return sdk.pipe([
        sdk.transaction(code),
        sdk.args([sdk.arg(amount, t.UFix64)]),
        sdk.proposer(proposer),
        sdk.authorizations([authorization]),
        sdk.payer(payer),
        sdk.validator((ix, {Ok, Bad}) => {
            if (ix.authorizations.length > 1) return Bad(ix, "template only requires one authorization.")
            return Ok(ix)
        })
    ])
}
