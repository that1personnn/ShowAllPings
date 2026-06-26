import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { showNotification } from "@api/Notifications";

export default definePlugin({
    name: "ShowAllPings",
    description: "Shows notifications for every ping (@mention, @everyone, @here)",
    authors: [{ name: "YourName", id: 0n }], // Change 0n to your Discord User ID (as BigInt)

    flux: {
        MESSAGE_CREATE({ message, channelId, optimistic }) {
            if (optimistic || message.author?.bot) return;

            const currentUser = FluxDispatcher.getStore("UserStore").getCurrentUser();
            if (!currentUser || message.author?.id === currentUser.id) return;

            const isPing =
                message.mentions?.some((m: any) => m.id === currentUser.id) ||
                message.mention_everyone ||
                (message.content && /@everyone|@here/i.test(message.content));

            if (!isPing) return;

            const pingType = message.mention_everyone ? "@everyone"
                          : message.content?.includes("@here") ? "@here"
                          : "@mention";

            const guild = FluxDispatcher.getStore("GuildStore").getGuild(message.guild_id);

            showNotification({
                title: `${pingType} in ${guild?.name ?? "DMs"}`,
                body: `${message.author.username}: ${message.content?.slice(0, 100) || ""}`,
                color: "#ED4245"
            });
        }
    },

    start() {
        console.log("%c[ShowAllPings] Plugin loaded successfully!", "color: #ED4245; font-weight: bold");
    }
});
