import React, { useEffect } from "react";
import {
  AvatarGroup,
  Avatar,
  // Fade
} from "@chakra-ui/react";
import { useRouter } from "next/router";

import { io } from "socket.io-client";
import { useQueryClient, useQuery } from "react-query";

const useWebSocketSubscription = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { slug } = router.query;
  const dossierIdParam = slug?.[slug.length - 2];

  // eslint-disable-next-line no-undef
  const { data: liveUsers } = useQuery("dossier:live_users", () => Promise.resolve([]), {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const socket = io("/dossier");
    socket.on("connect", () => {
      console.log(socket.id);

      socket.emit("dossier:connect", { dossierId: dossierIdParam }, ({ status, ...rest }) => {
        if (status === "KO") {
          console.log(rest);
          return socket.disconnect();
        }
      });
    });

    socket.on("dossier:live_users", async (payload) => {
      // console.log("event received", payload); // Received once
      // eslint-disable-next-line no-unused-vars
      queryClient.setQueryData("dossier:live_users", (oldData) => payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [dossierIdParam, queryClient]);

  return { liveUsers: liveUsers || [] };
};

// TODO @antoine why double rendering when receiveing a message (the event is received once) ??
// eslint-disable-next-line react/display-name
const LivePeopleAvatar = React.memo(() => {
  const { liveUsers } = useWebSocketSubscription();

  return (
    <AvatarGroup size="md" max={4}>
      {liveUsers.map((liveUser, i) => {
        return (
          <React.Fragment key={i}>
            {/* <Fade in={true} key={i}> */}
            <Avatar name={`${liveUser.prenom} ${liveUser.nom}`} />
            {/* </Fade> */}
          </React.Fragment>
        );
      })}
    </AvatarGroup>
  );
});
export default LivePeopleAvatar;
