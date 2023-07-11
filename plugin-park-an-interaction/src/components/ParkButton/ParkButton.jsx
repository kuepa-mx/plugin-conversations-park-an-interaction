import React, { useState } from "react";
import styled from "styled-components";
import { Actions } from "@twilio/flex-ui";

import { Button } from "@twilio-paste/core";
import { Spinner } from "@twilio-paste/core/spinner";

const IconWrapper = styled.div`
  margin: auto;
  cursor: ${(props) => (props.isLoading ? "not-allowed" : "pointer")};
`;

export const ParkButton = (props) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      {isLoading ? (
        <IconWrapper isLoading={isLoading}>
          <Spinner size="sizeIcon40" decorative={false} title="Loading" />
        </IconWrapper>
      ) : (
        <IconWrapper>
          <Button
            variant="destructive_secondary"
            onClick={() => {
              setIsLoading(true);
              Actions.invokeAction("ParkInteraction", { task: props.task });
            }}
          >
            Park Chat
          </Button>
        </IconWrapper>
      )}
    </>
  );
};
