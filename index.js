var Service, Characteristic;
var exec = require("child_process").exec;

module.exports = function(homebridge){
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-airvisual-pro", "AirVisualPro", AirVisualProAccessory);
}

function AirVisualProAccessory(log, config) {
	var informationService;
	var carbondioxideService;
	var airqualityService;
	var temperatureService;
	var humidityService;
	
	this.log = log;
	this.ip = config["ip"];
	this.user = config["user"];
	this.pass = config["pass"];
	this.co2_critical = config["co2_critical"];
	this.logging = config["logging"] || false;
	
	this.airdata = '';
	this.aq_status = 0;
	
	this.aqi = 0;
	this.pm25 = 0;
	this.pm10 = 0;
	this.temp_c = 0;
	this.hm = 0;
	this.co2 = 0;
	
	setInterval((function () {
		this.refresh();
	}).bind(this), 10000);
}


AirVisualProAccessory.prototype = {
	httpRequest: function(url, method, callback) {
	request({
		url: url,
		method: method
	},
	function (error, response, body) {
		//callback(error, response, body);
	})
},


identify: function(callback) {
	this.log("Identify requested!");
	callback(); // success
},

refresh: function() {
	var that = this;
	if (that.logging) {
		this.log ("Refreshing values...");
	}
	
	exec('smbget -q -U ' + that.user + '%' + that.pass + ' smb://' + that.ip + '/airvisual/latest_config_measurements.json', (error, stdout, stderr) => {
		if (that.logging) {
			that.log("[stdout]: " + JSON.stringify(stdout));
			that.log("[error]: " + JSON.stringify(error));
			that.log("[stderr]: " + JSON.stringify(stderr));
		}
		if(stdout != '') {
			that.airdata = JSON.parse(stdout);
		}
	});
	
	if(that.airdata.measurements) {
		var l_pm25_aqius;
		var l_pm25_ugm3;
		var l_pm10_ugm3;
		var l_temperature_C;
		var l_humidity_RH;
		var l_co2_ppm;
		if(Array.isArray(that.airdata.measurements)) {
			l_pm25_aqius = that.airdata.measurements[0].pm25_AQIUS;
			l_pm25_ugm3 = that.airdata.measurements[0].pm25_ugm3;
			l_pm10_ugm3 = that.airdata.measurements[0].pm10_ugm3;
			l_temperature_C = that.airdata.measurements[0].temperature_C;
			l_humidity_RH = that.airdata.measurements[0].humidity_RH;
			l_co2_ppm = that.airdata.measurements[0].co2_ppm;
		} else {
			l_pm25_aqius = that.airdata.measurements.pm25_AQIUS;
			l_pm25_ugm3 = that.airdata.measurements.pm25_ugm3;
			l_pm10_ugm3 = that.airdata.measurements.pm10_ugm3;
			l_temperature_C = that.airdata.measurements.temperature_C;
			l_humidity_RH = that.airdata.measurements.humidity_RH;
			l_co2_ppm = that.airdata.measurements.co2_ppm;
		}
		if(that.aqi != l_pm25_aqius) {
			if (that.logging) {
				that.log ("AQI - " + that.aqi + " -> " + l_pm25_aqius);
			}
			that.aqi = Number(l_pm25_aqius);
			that.setAirQuality(that.aqi);
		}
		if(that.pm25 != l_pm25_ugm3) {
			if (that.logging) {
				that.log ("PM2.5 (ug/m3) - " + that.pm25 + " -> " + l_pm25_ugm3);
			}
			that.pm25 = Number(l_pm25_ugm3);
			that.setPM25Density();
		}
		if(that.pm10 != l_pm10_ugm3) {
			if (that.logging) {
				that.log ("PM10 (ug/m3) - " + that.pm10 + " -> " + l_pm10_ugm3);
			}
			that.pm10 = Number(l_pm10_ugm3); 
			that.setPM10Density();
		}
		if(that.temp_c != l_temperature_C) {
			if (that.logging) {
				that.log ("Temperature (C) - " + that.temp_c + " -> " + l_temperature_C);
			}
			that.temp_c = Number(l_temperature_C); 
			that.setCurrentTemperature();
		}
		if(that.hm != l_humidity_RH) {
			if (that.logging) {
				that.log ("Humidity (%) - " + that.hm + " -> " + l_humidity_RH);
			}
			that.hm = Number(l_humidity_RH); 
			that.setHumidity();
		}
		if(that.co2 != l_co2_ppm) {
			if (that.logging) {
				that.log ("CO2 (ppm) - " + that.co2 + " -> " + l_co2_ppm);
			}
			that.co2 = Number(l_co2_ppm); 
			that.setCarbonDioxide();
			that.setCarbonDioxideDetected();
		}
	}
},

getAirQuality: function (callback) {
	var that = this;
	callback(null, that.aq_status);
},  

setAirQuality: function (aqi) {
	var that = this;
	if (aqi >= 0 && aqi <= 50) {
		that.aq_status = 1;
	} else if (aqi > 50 && aqi <= 100) {
		that.aq_status = 2;
	} else if (aqi > 100 && aqi <= 150) { 
		that.aq_status = 3;
	} else if (aqi > 150 && aqi <= 200) {
		that.aq_status = 4;
	} else if (aqi > 200) {
		that.aq_status = 5;
	} else {
		that.aq_status = 0;
	}
	that.airqualityService.setCharacteristic(Characteristic.AirQuality, that.aq_status);
},

getCurrentTemperature: function (callback) {
	var that = this;
	callback(null, that.temp_c);
},  

setCurrentTemperature: function() {
	var that = this;
	this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, that.temp_c);
},

getTemperatureUnits: function (callback) {
	var that = this;
	// 1 = F and 0 = C
	callback (null, 0);
},

getPM25Density: function (callback) {
	var that = this;
	if (that.logging) {
		that.log ("getting PM2.5 Density");
	}
	callback(null, that.pm25);
},  

setPM25Density: function() {
	var that = this;
	that.airqualityService.setCharacteristic(Characteristic.PM2_5Density, that.pm25);
},

getPM10Density: function (callback) {
	var that = this;
	if (that.logging) {
		that.log ("getting PM10 Density");
	}
	callback(null, that.pm10);
},  

setPM10Density: function() {
	var that = this;
	that.airqualityService.setCharacteristic(Characteristic.PM10Density, that.pm10);
},

getHumidity: function (callback) {
	var that = this;
	if (that.logging) {
		that.log ("getting Humidity");
	}
	callback(null, that.hm);
},  

setHumidity: function() {
	var that = this;
	that.humidityService.setCharacteristic(Characteristic.CurrentRelativeHumidity, that.hm);
},

getCarbonDioxide: function (callback) {
	var that = this;
	callback(null, that.co2);
},  

setCarbonDioxide: function() {
	var that = this;
	this.carbondioxideService.setCharacteristic(Characteristic.CarbonDioxideLevel, that.co2);
},

getCarbonDioxideDetected: function (callback) {
	var that = this;
	if(that.co2 > that.co2_critical) {
		callback(null, 1);
	} else {
		callback(null, 0);
	}
},  

setCarbonDioxideDetected: function() {
	var that = this;
	if(that.co2 > that.co2_critical) {
		if (that.logging) {
			that.log ("Carbon Dioxide Detected!");
		}
		that.carbondioxideService.setCharacteristic(Characteristic.CarbonDioxideDetected, 1);
	} else {
		that.carbondioxideService.setCharacteristic(Characteristic.CarbonDioxideDetected, 0);
	}
},

getServices: function() {
	// you can OPTIONALLY create an information service if you wish to override
	// the default values for things like serial number, model, etc.
	this.informationService = new Service.AccessoryInformation();
	this.airqualityService = new Service.AirQualitySensor();
	this.temperatureService = new Service.TemperatureSensor();
	this.carbondioxideService = new Service.CarbonDioxideSensor();
	this.humidityService = new Service.HumiditySensor();
	
	this.informationService
		.setCharacteristic(Characteristic.Manufacturer, "IQAir AirVisual")
		.setCharacteristic(Characteristic.Model, "AirVisual Pro")
		.setCharacteristic(Characteristic.SerialNumber, this.ip)
	
	this.airqualityService
		.getCharacteristic(Characteristic.AirQuality)
		.on('get', this.getAirQuality.bind(this));
	
	this.airqualityService
		.getCharacteristic(Characteristic.PM2_5Density)
		.on('get', this.getPM25Density.bind(this));
	
	this.airqualityService
		.getCharacteristic(Characteristic.PM10Density)
		.on('get', this.getPM10Density.bind(this));
	
	this.carbondioxideService
		.getCharacteristic(Characteristic.CarbonDioxideDetected)
		.on('get', this.getCarbonDioxideDetected.bind(this));
	
	this.carbondioxideService
		.getCharacteristic(Characteristic.CarbonDioxideLevel)
		.on('get', this.getCarbonDioxide.bind(this));
	
	this.temperatureService
		.getCharacteristic(Characteristic.CurrentTemperature)
		.on('get', this.getCurrentTemperature.bind(this));
	
	this.humidityService
		.getCharacteristic(Characteristic.CurrentRelativeHumidity)
		.on('get', this.getHumidity.bind(this));
	
	return [this.informationService, this.airqualityService, this.temperatureService, this.carbondioxideService, this.humidityService];
	}
};
