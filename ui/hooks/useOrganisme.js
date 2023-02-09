import { useState, useEffect, useCallback } from "react";
import { _get, _put } from "../common/httpClient";
import { useRecoilState } from "recoil";
import { organismeAtom } from "./organismeAtoms";

const fetchOrganisme = async (organisme_id) => {
  if (!organisme_id) return { organisme: null };
  try {
    const organisme = await _get(`/api/v1/organisme/entity/${organisme_id}?organisme_id=${organisme_id}`);
    return { organisme };
  } catch (e) {
    if (e.statusCode === 404) {
      return { organisme: null };
    } else {
      console.error(e);
    }
    return { organisme: null };
  }
};

export function useOrganisme(organisme_id) {
  const [isloaded, setIsLoaded] = useState(false);
  const [isReloaded, setIsReloaded] = useState(false);
  const [error, setError] = useState(null);

  const [organisme, setOrganisme] = useRecoilState(organismeAtom);

  const updateOrganisme = useCallback(
    async (id, data) => {
      id = organisme._id || id;
      let upOrganisme = null;
      try {
        upOrganisme = await _put(`/api/v1/organisme/entity/${id}`, {
          ...data,
          organisme_id: id,
        });
      } catch (e) {
        setError(e);
      } finally {
        setOrganisme(upOrganisme);
      }
      return upOrganisme;
    },
    [organisme?._id, setOrganisme]
  );

  useEffect(() => {
    if (!organisme_id) return;
    // TODO A lot of re-render ~15 - Maybe add Ref ?
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
    updateOrganisme,
  };
}
