"use client";

import axios from "@/lib/axios";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const AxiosProvider = ({
  children,
  accessToken,
}: {
  children: React.ReactNode;
  accessToken?: string;
}) => {
  const { getToken } = useAuth();

  // useEffect(() => {
  //   if (accessToken) {
  //     axios.defaults.headers.common.Authorization = "Bearer " + accessToken;
  //   }
  // }, [accessToken]);

  useEffect(() => {
    axios.interceptors.request.use(async function (config) {
      const token = await getToken();

      config.headers.Authorization = "Bearer " + token;

      return config;
    });
  }, [getToken]);

  return <>{children}</>;
};

export default AxiosProvider;
