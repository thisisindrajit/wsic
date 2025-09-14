import { Client } from "@upstash/qstash";
import { NextResponse } from "next/server";

const client = new Client({ token: process.env.QSTASH_TOKEN! });

export const POST = async (req: Request) => {
  try {
    const { topic, difficulty, user_id } = await req.json();

    const result = await client.publishJSON({
      url: process.env.TOPIC_GENERATOR_RENDER_URL!,
      body: {
        topic: topic,
        difficulty: difficulty,
        user_id: user_id,
        publish_immediately: "True",
      },
      retries: 3,
      retryDelay: "30000" // 30 seconds in ms
    });

    return NextResponse.json({
      message: "Topic queued for generation!",
      qstashMessageId: result.messageId,
    });
  } catch (error) {
    return NextResponse.json({
      message: "Error queuing topic for generation!",
      error: error,
    });
  }
};
