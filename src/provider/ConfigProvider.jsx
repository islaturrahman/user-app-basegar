import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get } from "../data/api";
import { config_url } from "../config/enpoints";
import ConfigModel from "../models/ConfigModel";

export const ConfigContext = React.createContext({
  config: [],
  getConfig: async () => {},
  fetchConfig: async () => {},
});

const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const configModel = new ConfigModel();

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const resp = await get(config_url);
      if (resp) {
        await AsyncStorage.setItem("config", JSON.stringify(resp));
        setConfig(resp);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching config:", error);
    }
  };

  const getConfig = async () => {
    setLoading(true);
    const confRaw = await AsyncStorage.getItem("config");
    let conf = null;
    if (confRaw) {
      conf = JSON.parse(confRaw);
    }

    if (!conf) {
      console.log(conf);
      await fetchConfig();
    } else {
      setConfig(conf);
    }
    setLoading(false);
    return conf;
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const value = { config, getConfig, fetchConfig, loading };
  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export default ConfigProvider;
