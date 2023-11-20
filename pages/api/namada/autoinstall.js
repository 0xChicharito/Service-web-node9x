import projects from 'data/projects'
import { fetchNetInfo } from '@utils/fetchProject.js'

export default function handler(req, res) {
	res.setHeader('Cache-Control', 'no-store, max-age=0')

	const projectName = 'namada'
	const type = 'testnet'

	const project = projects[type][projectName]

	const {
		bin,
		path,
		peerID,
		seedID,
		seedPort,
		peerPort,
		unsafeReset,
		chainID,
		installBin,
		variable,
		minGasPrice,
		denom,
		goVersion,
		newExecStart,
		newInit
	} = project
	const name = projectName

	const execStart = newExecStart == undefined ? `$(which ${bin}) start --home $HOME/${path}` : newExecStart
	let init = ''

	if (newInit !== 'false') {
		init = newInit == undefined ? `${bin} init "$MONIKER" --chain-id ${chainID}` : newInit
	}

	let livePeers = []

	const netInfo = () => {
		fetchNetInfo(name, type)
			.then(info => {
				const peers = info.peers
				const letters = /[a-zA-Z]/

				peers.map(peer => {
					if (peer.is_outbound === true) {
						let ip = peer.remote_ip
						const id = peer.node_info.id
						const listen_addr = peer.node_info.listen_addr

						if (letters.test(ip)) {
							ip = `[${ip}]`
						}

						let i = listen_addr.length - 1
						let port = ''

						while (listen_addr[i] !== ':') {
							port += listen_addr[i]
							i--
						}
						port = port.split('').reverse().join('')
						livePeers.push(`${id}@${ip}:${port}`)
					}
				})
				livePeers.unshift('')
				livePeers = livePeers.join()
			})
			.catch(err => {
				console.log(err)
			})
	}

	netInfo()

	let PEERS = '""',
		SEEDS = '""'
	if (peerID) {
		PEERS = `"${peerID}@${name}-${type}-peer.itrocket.net:${peerPort}${livePeers}"`
	}
	if (seedID) {
		SEEDS = `"${seedID}@${name}-${type}-seed.itrocket.net:${seedPort}"`
	}

	res.status(200).send(`#!/bin/bash
source <(curl -s https://raw.githubusercontent.com/itrocket-team/testnet_guides/main/utils/common.sh)

printLogo

read -p "Enter WALLET name:" WALLET
echo 'export WALLET='$WALLET
read -p "Enter your ALIAS :" ALIAS
echo 'export ALIAS='$ALIAS
NAMADA_PORT=26
read -p "Enter your NAMADA_PORT (for example 17, 18, 19... default port=$NAMADA_PORT): " input_port
if [ ! -z "$input_port" ]; then
    NAMADA_PORT=$input_port
fi
echo 'export PORT='$PORT

# set vars
echo "export NAMADA_PORT="$NAMADA_PORT"" >> $HOME/.bash_profile
echo "export ALIAS="CHOOSE_A_NAME_FOR_YOUR_VALIDATOR"" >> $HOME/.bash_profile
echo "export WALLET="CHOOSE_A_WALLET_NAME"" >> $HOME/.bash_profile
echo "export PUBLIC_IP=$(wget -qO- eth0.me)" >> $HOME/.bash_profile
echo "export TM_HASH="v0.1.4-abciplus"" >> $HOME/.bash_profile
echo "export CHAIN_ID="public-testnet-14.5d79b6958580"" >> $HOME/.bash_profile
echo "export BASE_DIR="$HOME/.local/share/namada"" >> $HOME/.bash_profile
source $HOME/.bash_profile

printLine
echo -e "Alias:        \\e[1m\\e[32m$ALIAS\\e[0m"
echo -e "Wallet:         \\e[1m\\e[32m$WALLET\\e[0m"
echo -e "Chain id:       \\e[1m\\e[32m$CHAIN_ID\\e[0m"
echo -e "Node custom port:  \\e[1m\\e[32m$NAMADA_PORT\\e[0m"
echo -e "Node base directory:  \\e[1m\\e[32m$BASE_DIR\\e[0m"
printLine
sleep 1

printGreen "1. Installing go..." && sleep 1
# install go, if needed
cd $HOME
! [ -x "$(command -v go)" ] && {
VER="1.20.3"
wget "https://golang.org/dl/go$VER.linux-amd64.tar.gz"
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf "go$VER.linux-amd64.tar.gz"
rm "go$VER.linux-amd64.tar.gz"
[ ! -f ~/.bash_profile ] && touch ~/.bash_profile
echo "export PATH=$PATH:/usr/local/go/bin:~/go/bin" >> ~/.bash_profile
source $HOME/.bash_profile
}
[ ! -d ~/go/bin ] && mkdir -p ~/go/bin

echo $(go version) && sleep 1

source <(curl -s https://raw.githubusercontent.com/itrocket-team/testnet_guides/main/utils/dependencies_install)
sudo apt-get install -y git-core libssl-dev pkg-config libclang-12-dev protobuf-compiler

printGreen "4. Installing binary..." && sleep 1
# download binary
${installBin}

printGreen "5. Configuring and init app..." && sleep 1
# config and init app
${bin} config node tcp://localhost:\${${variable}_PORT}657
${bin} config keyring-backend os
${bin} config chain-id ${chainID}
${init}
sleep 1
echo done

printGreen "6. Downloading genesis and addrbook..." && sleep 1
# download genesis and addrbook
wget -O $HOME/${path}/config/genesis.json https://${type}-files.itrocket.net/${name}/genesis.json
wget -O $HOME/${path}/config/addrbook.json https://${type}-files.itrocket.net/${name}/addrbook.json
sleep 1
echo done

printGreen "7. Adding seeds, peers, configuring custom ports, pruning, minimum gas price..." && sleep 1
# set seeds and peers
SEEDS=${SEEDS}
PEERS=${PEERS}
sed -i -e "s/^seeds *=.*/seeds = \\"$SEEDS\\"/; s/^persistent_peers *=.*/persistent_peers = \\"$PEERS\\"/" $HOME/${path}/config/config.toml

# set custom ports in app.toml
sed -i.bak -e "s%:1317%:\${${variable}_PORT}317%g;
s%:8080%:\${${variable}_PORT}080%g;
s%:9090%:\${${variable}_PORT}090%g;
s%:9091%:\${${variable}_PORT}091%g;
s%:8545%:\${${variable}_PORT}545%g;
s%:8546%:\${${variable}_PORT}546%g;
s%:6065%:\${${variable}_PORT}065%g" $HOME/${path}/config/app.toml


# set custom ports in config.toml file
sed -i.bak -e "s%:26658%:\${${variable}_PORT}658%g;
s%:26657%:\${${variable}_PORT}657%g;
s%:6060%:\${${variable}_PORT}060%g;
s%:26656%:\${${variable}_PORT}656%g;
s%^external_address = \\"\\"%external_address = \\"$(wget -qO- eth0.me):\${${variable}_PORT}656\\"%;
s%:26660%:\${${variable}_PORT}660%g" $HOME/${path}/config/config.toml

# config pruning
sed -i -e "s/^pruning *=.*/pruning = \\"nothing\\"/" $HOME/${path}/config/app.toml
sed -i -e "s/^pruning-keep-recent *=.*/pruning-keep-recent = \\"100\\"/" $HOME/${path}/config/app.toml
sed -i -e "s/^pruning-interval *=.*/pruning-interval = \\"50\\"/" $HOME/${path}/config/app.toml

# set minimum gas price, enable prometheus and disable indexing
sed -i 's|minimum-gas-prices =.*|minimum-gas-prices = "${minGasPrice}"|g' $HOME/${path}/config/app.toml
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/${path}/config/config.toml
sed -i -e "s/^indexer *=.*/indexer = \\"null\\"/" $HOME/${path}/config/config.toml
sleep 1
echo done

# create service file
sudo tee /etc/systemd/system/${bin}.service > /dev/null <<EOF
[Unit]
Description=${projectName} node
After=network-online.target
[Service]
User=$USER
WorkingDirectory=$HOME/${path}
ExecStart=${execStart}
Restart=on-failure
RestartSec=5
LimitNOFILE=65535
[Install]
WantedBy=multi-user.target
EOF

printGreen "8. Downloading snapshot and starting node..." && sleep 1
# reset and download snapshot
${bin} ${unsafeReset} --home $HOME/${path}
if curl -s --head curl https://${type}-files.itrocket.net/${name}/snap_${name}.tar.lz4 | head -n 1 | grep "200" > /dev/null; then
  curl https://${type}-files.itrocket.net/${name}/snap_${name}.tar.lz4 | lz4 -dc - | tar -xf - -C $HOME/${path}
    else
  echo no have snap
fi

# enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ${bin}
sudo systemctl restart ${bin} && sudo journalctl -u ${bin} -f`)
}
