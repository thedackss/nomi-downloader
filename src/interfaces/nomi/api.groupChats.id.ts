import type { GroupChat } from "./api.groupChats";

// The /group-chats/:id endpoint returns a single group chat with the same
// shape as an entry from the /group-chats list.
export type ApiGroupChatsIdResponse = GroupChat;
