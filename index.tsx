import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { showNotification } from "@api/Notifications";
import { HeaderBarButton } from "@api/HeaderBar";
import { React } from "@webpack/common";

export default definePlugin({
    name: "ShowAllPings",
    description: "Shows notifications for EVERY ping + Test button in toolbar (like Soggy)",
    authors: [{ name: "YourName", id: 0n }], // Change to your Discord ID

    // Adds button to the top-right header bar
    headerBarButton: {
        icon: () => (
            <span style={{ fontSize: "18px", lineHeight: "1" }}>🛎️</span>
        ),
        tooltip: "Test All Pings",
        onClick: () => {
            showNotification({
                title: "Test Ping Notification",
                body: "This is a test! @everyone and @here work too.",
                color: "#ED4245"
            });
        }
    },

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
        console.log("%c[ShowAllPings] ✅ Loaded with toolbar button!", "color: #ED4245; font-weight: bold");
    }
});
