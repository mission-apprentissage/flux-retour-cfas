import { isInitialServerSideProps } from "./isInitialServerSideProps";
import { anonymous } from "../anonymous";
import axios from "axios";

export const getAuthServerSideProps = async (context) => {
  if (!isInitialServerSideProps(context)) {
    return {};
  }
  try {
    const { status, data } = await axios.get(`${process.env.SERVER_URI}/api/v1/session/current`, {
      headers: context.req.headers,
    });
    const auth = status === 200 ? data : anonymous;
    return { auth };
  } catch (e) {
    return { auth: anonymous };
  }
};
