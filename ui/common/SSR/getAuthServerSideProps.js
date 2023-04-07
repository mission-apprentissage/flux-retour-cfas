import { isInitialServerSideProps } from "./isInitialServerSideProps";
import axios from "axios";

export const getAuthServerSideProps = async (context) => {
  if (!isInitialServerSideProps(context)) {
    return {};
  }
  try {
    const { status, data } = await axios.get(`${process.env.SERVER_URI}/api/v1/session`, {
      headers: context.req.headers,
    });
    return {
      auth: status === 200 ? data : null,
    };
  } catch (e) {
    return { auth: null };
  }
};
