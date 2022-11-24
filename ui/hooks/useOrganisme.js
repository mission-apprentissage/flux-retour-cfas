import { useState, useEffect } from "react";
import { _get } from "../common/httpClient";
import { useRecoilState } from "recoil";
import { organismeAtom } from "./organismeAtoms";
import { useEspace } from "./useEspace";

const fetchOrganisme = async (organisme_id) => {
  if (!organisme_id) return { organisme: null };
  try {
    const organisme = await _get(`/api/v1/organisme/entity/${organisme_id}?organisme_id=${organisme_id}`);
    return { organisme };
  } catch (e) {
    if (e.statusCode === 404) {
      return { organisme: null };
    } else {
      console.log({ e });
    }
    return { organisme: null };
  }
};

export function useOrganisme() {
  let { organisme_id } = useEspace();

  const [isloaded, setIsLoaded] = useState(false);
  const [isReloaded, setIsReloaded] = useState(false);
  const [error, setError] = useState(null);

  const [organisme, setOrganisme] = useRecoilState(organismeAtom);

  useEffect(() => {
    const abortController = new AbortController();
    setIsReloaded(false);
    fetchOrganisme(organisme_id)
      .then(({ organisme }) => {
        if (!abortController.signal.aborted) {
          setOrganisme(organisme);
          setIsReloaded(true);
          setIsLoaded(true);
        }
      })
      .catch((e) => {
        if (!abortController.signal.aborted) {
          setError(e);
          setIsReloaded(false);
          setIsLoaded(false);
        }
      });
    return () => {
      abortController.abort();
    };
  }, [organisme_id, setOrganisme]);

  if (error !== null) {
    throw error;
  }

  return {
    isloaded,
    isReloaded,
    organisme,
  };
}
