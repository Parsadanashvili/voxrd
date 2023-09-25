import { Channel, Member, Profile, Server } from "@prisma/client";

export type ServerWithChannelWithMembers = Server & {
  channel: Channel[];
  members: (Member & {
    profile: Profile;
  })[];
};
