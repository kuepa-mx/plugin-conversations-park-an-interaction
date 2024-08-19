import React from "react";
import { FlexPlugin } from "@twilio/flex-plugin";
import { CustomizationProvider } from "@twilio-paste/core/customization";

import { ParkButton } from "./components";
import "./notifications";
import "./actions";

const PLUGIN_NAME = "ConversationsParkAnInteractionPlugin";

export default class ConversationsParkAnInteractionPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  async init(flex, manager) {
    flex.setProviders({
      PasteThemeProvider: CustomizationProvider,
    });

    // Conditional assignment for assigned Chat tasks.
    const isAssignedChatTask = (props) => { // Imprime el contenido de props
      return props.channelDefinition.capabilities.has("Chat") &&
        props.task.taskStatus === "assigned" && props.task.queueName === 'whatsapp_kuepa' || props.task.queueName === 'call-kuepa-chatbot-baja' || props.task.queueName === 'call-kuepa-chatbot-test' || props.task.queueName === 'whatsapp_interno' || props.task.queueName === 'queue-recupero-promesas' || props.task.queueName === 'whatsapp_alumno_especial';
    };

    flex.TaskCanvasHeader.Content.remove("actions", {
      if: isAssignedChatTask,
    });

    flex.TaskCanvasHeader.Content.add(
      <ParkButton key="conversation-park-button" />,
      {
        sortOrder: 1,
        if: isAssignedChatTask,
      }
    );
  }
}
