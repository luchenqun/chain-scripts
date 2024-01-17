import fs from "fs-extra"
import bfj from "bfj"

const COUNT = 2

bfj.read("./genesis.json")
  .then(genesis => {
    const appState = genesis.app_state
    appState.auth.accounts = appState.auth.accounts.slice(0, COUNT)
    appState.bank.balances = appState.bank.balances.slice(0, COUNT)
    appState.claims.claims_records = appState.claims.claims_records.slice(0, COUNT)
    appState.evm.accounts = appState.evm.accounts.slice(0, COUNT)
    appState.genutil.gen_txs = appState.genutil.gen_txs.slice(0, COUNT)
    appState.gov.proposals = appState.gov.proposals.slice(0, 1)
    appState.gov.votes = appState.gov.votes.slice(0, COUNT)
    appState.distribution.delegator_withdraw_infos = appState.distribution.delegator_withdraw_infos.slice(0, COUNT)
    appState.distribution.validator_accumulated_commissions = appState.distribution.validator_accumulated_commissions.slice(0, COUNT)
    appState.distribution.validator_historical_rewards = appState.distribution.validator_historical_rewards.slice(0, COUNT)
    appState.distribution.validator_current_rewards = appState.distribution.validator_current_rewards.slice(0, COUNT)
    appState.distribution.delegator_starting_infos = appState.distribution.delegator_starting_infos.slice(0, COUNT)
    appState.distribution.validator_slash_events = appState.distribution.validator_slash_events.slice(0, COUNT)

    appState.ibc = {}
    // appState.ibc.client_genesis.clients = appState.ibc.client_genesis.clients.slice(0, 1)
    // appState.ibc.client_genesis.clients_consensus = appState.ibc.client_genesis.clients_consensus.slice(0, 1)
    // appState.ibc.client_genesis.clients_metadata = appState.ibc.client_genesis.clients_metadata.slice(0, 1)
    // appState.ibc.connection_genesis.connections = appState.ibc.connection_genesis.connections.slice(0, 1)
    // appState.ibc.connection_genesis.client_connection_paths = appState.ibc.connection_genesis.client_connection_paths.slice(0, 1)
    // appState.ibc.channel_genesis.channels = appState.ibc.channel_genesis.channels.slice(0, 1)
    // appState.ibc.channel_genesis.acknowledgements = appState.ibc.channel_genesis.acknowledgements.slice(0, 1)
    // appState.ibc.channel_genesis.commitments = appState.ibc.channel_genesis.commitments.slice(0, 1)
    // appState.ibc.channel_genesis.receipts = appState.ibc.channel_genesis.receipts.slice(0, 1)
    // appState.ibc.channel_genesis.send_sequences = appState.ibc.channel_genesis.send_sequences.slice(0, 1)
    // appState.ibc.channel_genesis.recv_sequences = appState.ibc.channel_genesis.recv_sequences.slice(0, 1)
    // appState.ibc.channel_genesis.ack_sequences = appState.ibc.channel_genesis.ack_sequences.slice(0, 1)

    appState.staking.last_validator_powers = appState.staking.last_validator_powers.slice(0, COUNT)
    appState.staking.validators = appState.staking.validators.slice(0, COUNT)
    appState.staking.delegations = appState.staking.delegations.slice(0, COUNT)
    appState.staking.unbonding_delegations = appState.staking.unbonding_delegations.slice(0, COUNT)
    appState.staking.redelegations = appState.staking.redelegations.slice(0, COUNT)

    appState.slashing.missed_blocks = appState.slashing.missed_blocks.slice(0, COUNT)
    appState.slashing.signing_infos = appState.slashing.signing_infos.slice(0, COUNT)

    fs.writeJSONSync("./genesis-simple.json", genesis)
  })
  .catch(error => {
    console.log(error)
  });
