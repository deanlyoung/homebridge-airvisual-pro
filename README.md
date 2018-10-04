# homebridge-airvisual-pro

[AirVisual Pro](https://www.airvisual.com/air-quality-monitor) plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation

1. Install Homebridge using: `[sudo] npm install -g homebridge`
2. Install this plugin using: `[sudo] npm install -g homebridge-airvisual-pro`
3. Update your configuration file. See the sample below.

# Updating

- `[sudo] npm install -g homebridge-airvisual-pro`

# Configuration

## Sample Configuration

```json
"accessories": [
        {
            "accessory": "AirVisualPro",
            "name": "AirVisual Pro",
            "ip": "10.0.1.2",
            "user": "airvisual",
            "pass": "p4ssw0rd",
            "co2_critical": 1000
        }
]
```

## Workaround
smbclient package is required. `sudo apt-get install smbclient`

#Credits
Based on the great work of [macnow/homebridge-airvisual-node](https://github.com/macnow/homebridge-airvisual-node).