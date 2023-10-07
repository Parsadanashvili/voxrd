import axios from "axios";

const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export default axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    ...defaultHeaders,
  },
});
