import { definePlugin } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { showNotification } from "@utils/notifications";
import { findByPropsLazy } from "@webpack";
import { Button, Text } from "@webpack/common";

export default definePlugin({
    name: "ShowAllPings",
    description: "Shows desktop notifications for EVERY ping (@mention, @everyone, @here) + Test button",
    authors: [{ name: "YourName", id: 0n }], // ← Change to your Discord User ID (as BigInt)

    settings: {
        testButton: {
            type: "component",
            description: "Click to test the notification",
            component: () => (
                <Button
                    color={Button.Colors.RED}
                    onClick={() => {
                        showNotification({
                            title: "Test Ping Notification",
                            body: "This is a test! @everyone @here should work the same way.",
                            color: "#ED4245",
                            onClick: () => console.log("Test notification clicked!")
                        });
                        console.log("%c[ShowAllPings] Test notification sent!", "color:#ED4245;font-weight:bold");
                    }}
                >
                    Test Notification
                </Button>
            )
        }
    },

    flux: {
        MESSAGE_CREATE({ message, channelId, optimistic }) {
            if (optimistic || message.author?.bot || message.author?.id === FluxDispatcher.getStore("UserStore").getCurrentUser()?.id) return;

            const currentUser = FluxDispatcher.getStore("UserStore").getCurrentUser();
            if (!currentUser) return;

            const isPing = 
                message.mentions?.some(m => m.id === currentUser.id) ||
                message.mention_everyone ||
                (message.content && /@everyone|@here/i.test(message.content));

            if (!isPing) return;

            const pingType = message.mention_everyone ? "@everyone" 
                          : message.content?.includes("@here") ? "@here" 
                          : "@mention";

            const guild = FluxDispatcher.getStore("GuildStore").getGuild(message.guild_id);
            const channel = FluxDispatcher.getStore("ChannelStore").getChannel(channelId);

            showNotification({
                title: `${pingType} in ${guild?.name ?? "DMs"}`,
                body: `${message.author.username}: ${message.content?.slice(0, 120)}${message.content?.length > 120 ? "..." : ""}`,
                color: "#ED4245",
                onClick: () => {
                    FluxDispatcher.dispatch({
                        type: "CHANNEL_SELECT",
                        guildId: message.guild_id,
                        channelId
                    });
                }
            });
        }
    },

    start() {
        console.log("%c[ShowAllPings] Plugin loaded - Test button available in settings", "color:#ED4245;font-weight:bold");
    }
});
