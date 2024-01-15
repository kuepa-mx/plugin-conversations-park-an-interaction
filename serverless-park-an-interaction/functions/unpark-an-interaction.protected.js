const path = Runtime.getFunctions()["response-header"].path;
const response = require(path).response();

async function removeAllWebhooks(client, conversationSid) {
  try {
    // Remove all scoped-webhooks to avoid triggering the webhook again
    const webhooks = await client.conversations
      .conversations(conversationSid)
      .webhooks.list();

    if (webhooks?.length) {
      for (const webhook of webhooks) await webhook.remove();
    }
  } catch (e) {
    console.error(`Failed to remove webhooks from ${conversationSid}: ${e}`);
  }
}

exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  const workspaceSid = context.WORKSPACE_SID;

  const conversationSid = event.ConversationSid;

  try {
    // Fetch the conversation attributes updated when parked
    const conversation = await client.conversations
      .conversations(conversationSid)
      .fetch();

    // Parse attributes
    const { attributes } = conversation;

    const {
      interactionSid,
      channelSid,
      taskAttributes,
      taskChannelUniqueName,
      webhookSid,
      workflowSid,
    } = JSON.parse(attributes);

    /* // Obtain participants to check for the 7900 number
    // TODO: REMOVE THIS AFTER SOME TIME.
    const participants = await conversation.participants().list();

    if (participants?.length) {
      // Check if the 7900 number is in the conversation
      const has7900 = participants.find(
        (participant) =>
          participant?.messagingBinding?.proxy_address ===
          "whatsapp:+15512927900"
      );

      if (has7900?.length) {
        // Remove all scoped-webhooks to not send it back to Flex.
        await removeAllWebhooks(client, conversationSid);

        // End the function execution.
        callback(null, response);
        return;
      }
    } */

    // Remove webhook so it doesn't keep triggering if parked more than once
    // await removeAllWebhooks(client, conversationSid);
    await client.conversations
      .conversations(conversationSid)
      .webhooks(webhookSid)
      .remove();

    // Create a new task through the invites endpoint. Alternatively you can pass
    // a queue_sid and a worker_sid inside properties to add a specific agent back to the interation
    await client.flexApi.v1
      .interaction(interactionSid)
      .channels(channelSid)
      .invites.create({
        routing: {
          properties: {
            workspace_sid: workspaceSid,
            workflow_sid: workflowSid,
            task_channel_unique_name: taskChannelUniqueName,
            attributes: taskAttributes,
          },
        },
      });

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
