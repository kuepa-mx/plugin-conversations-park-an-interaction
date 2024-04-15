const path = Runtime.getFunctions()["response-header"].path;
const response = require(path).response();
const axios = require("axios");

exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  const CONVERSATIONS_WEBHOOK_URL = context.CONVERSATIONS_WEBHOOK_URL;

  const interactionSid = event.interactionSid;
  const channelSid = event.channelSid;
  const participantSid = event.participantSid;
  const conversationSid = event.conversationSid;
  const taskSid = event.taskSid;
  const workflowSid = event.workflowSid;
  const taskChannelUniqueName = event.taskChannelUniqueName;
  const targetSid = event.targetSid;
  const workerName = event.workerName;
  const taskAttributes = event.taskAttributes;

  try {
    try {
      const participants = await client.conversations.v1
        .conversations(conversationSid)
        .participants.list();
      const binding = participants.find(
        (participant) => participant?.messagingBinding
      )?.messagingBinding;

      if (binding) {
        const { proxy_address, address } = binding;

        // Create the message.
        const message = await client.messages.create({
          to: address,
          from: proxy_address,
          body: "Gracias por comunicarte a la Uk, la conversación ha quedado cerrada. Recuerda que al referir a un amigo a estudiar una Licenciatura con nosotros puedes llevarte un 70% de descuento en tu próxima colegiatura.",
        });

        // Attach the message to the conversation's attributes to not re-send it.
        const conversation = await client.conversations
          .conversations(conversationSid)
          .fetch();

        const attributes = JSON.parse(conversation.attributes);

        attributes["alertMessage"] = true;

        // Set the new attributes on the conversation.
        await client.conversations
          .conversations(conversationSid)
          .update({ attributes: `${JSON.stringify(attributes)}` });
      }
    } catch (error) {
      console.log(error);
    }

    // Remove the agent
    await client.flexApi.v1
      .interaction(interactionSid)
      .channels(channelSid)
      .participants(participantSid)
      .update({ status: "closed" })
      .then((interaction_channel_participant) =>
        console.log(interaction_channel_participant)
      );

    // Create the webhook and update conversation attributes (if not ignoring parking logic)
    let webhook = null;
    if (!taskAttributes?.ignoreParkingLogic)
      webhook = await client.conversations
        .conversations(conversationSid)
        .webhooks.create({
          "configuration.method": "POST",
          "configuration.filters": ["onMessageAdded"],
          "configuration.url": CONVERSATIONS_WEBHOOK_URL,
          target: "webhook",
        });

    const webhookSid = webhook?.sid;
    const attributes = {
      // Detail if the parking logic webhook was ignored or not.
      interactionSid,
      channelSid,
      participantSid,
      taskSid,
      workflowSid,
      taskChannelUniqueName,
      targetSid,
      workerName,
      taskAttributes,
      webhookSid,
    };

    // Set the parked flag.
    if (taskAttributes?.ignoreParkingLogic) attributes["hasBeenParked"] = true;

    await client.conversations
      .conversations(conversationSid)
      .update({ attributes: `${JSON.stringify(attributes)}` })
      .then((conversation) => {
        console.log("conversation attributes updated");
        console.log(conversation);
      });

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
