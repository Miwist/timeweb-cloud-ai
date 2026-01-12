import { TimewebCloudAIClient } from "./client.js";
import {
  AgentResponse,
  CallAgentRequest,
  ChatCompletionRequest,
} from "./types.js";

export class AgentInstance {
  constructor(
    private readonly client: TimewebCloudAIClient,
    public readonly agent_access_id: string
  ) {}

  call(payload: CallAgentRequest): Promise<AgentResponse> {
    return this.client.call(this.agent_access_id, payload);
  }

  chatCompletions(payload: ChatCompletionRequest): Promise<any> {
    return this.client.chatCompletions(this.agent_access_id, payload);
  }

  getModels(): Promise<{ object: "list"; data: Array<{ id: string }> }> {
    return this.client.getModels(this.agent_access_id);
  }
}
