import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { showNotification } from "@api/Notifications";
import { HeaderBarButton } from "@api/HeaderBar";
import { React } from "@webpack/common";
import { ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Button, Text, ScrollerThin } from "@webpack/common";

interface Ping {
    id: string;
    timestamp: Date;
    pingType: string;
    author: string;
    content: string;
    guildName?: string;
    channelName?: string;
    channelId: string;
    guildId?: string;
}

let pings: Ping[] = [];

function PingHistoryModal({ modalProps }: { modalProps: any }) {
    return (
        <ModalRoot size={ModalSize.MEDIUM} {...modalProps}>
            <ModalHeader>
                <Text variant="heading-lg/semibold">Ping History</Text>
            </ModalHeader>
            <ModalContent>
                <ScrollerThin style={{ maxHeight: "400px" }}>
                    {pings.length === 0 ? (
                        <Text variant="text-md/normal" style={{ textAlign: "center", padding: "20px" }}>
                            No pings yet. Get pinged and they'll appear here!
                        </Text>
                    ) : (
                        pings.slice().reverse().map((ping, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: "12px",
                                    margin: "8px",
                                    backgroundColor: "var(--background-secondary)",
                                    borderRadius: "8px",
                                    cursor: "pointer"
                                }}
                                onClick={() => {
                                    FluxDispatcher.dispatch({
                                        type: "CHANNEL_SELECT",
                                        guildId: ping.guildId,
                                        channelId: ping.channelId
                                    });
                                    modalProps.onClose();
                                }}
                            >
                                <Text variant="text-md/bold" style={{ color: "#ED4245" }}>
                                    {ping.pingType} • {ping.timestamp.toLocaleTimeString()}
                                </Text>
                                <Text variant="text-sm/normal">
                                    <strong>{ping.author}</strong> in {ping.guildName ?? "DMs"} {ping.channelName ? `#${ping.channelName}` : ""}
                                </Text>
                                <Text variant="text-sm/normal" style={{ opacity: 0.8 }}>
                                    {ping.content}
                                </Text>
                            </div>
                        ))
                    )}
                </ScrollerThin>
            </ModalContent>
            <ModalFooter>
                <Button
                    color={Button.Colors.RED}
                    onClick={() => {
                        pings = [];
                        modalProps.onClose();
                    }}
                >
                    Clear History
                </Button>
                <Button onClick={modalProps.onClose}>Close</Button>
            </ModalFooter>
        </ModalRoot>
    );
}

export default definePlugin({
    name: "ShowAllPings",
    description: "Shows notifications for every ping + Toolbar button that opens ping history",
    authors: [{ name: "YourName", id: 0n }], // Change to your Discord ID

    headerBarButton: {
        render: () => (
            <HeaderBarButton
                tooltip="Ping History"
                icon={() => <span style={{ fontSize: "20px" }}>🛎️</span>}
                onClick={() => openModal(props => <PingHistoryModal modalProps={props} />)}
            />
        )
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
            const channel = FluxDispatcher.getStore("ChannelStore").getChannel(channelId);

            const ping: Ping = {
                id: message.id,
                timestamp: new Date(),
                pingType,
                author: message.author.username,
                content: message.content?.slice(0, 150) || "",
                guildName: guild?.name,
                channelName: channel?.name,
                channelId,
                guildId: message.guild_id
            };

            pings.unshift(ping); // Add to top
            if (pings.length > 50) pings.pop(); // Limit to 50 pings

            // Also show desktop notification
            showNotification({
                title: `${pingType} in ${guild?.name ?? "DMs"}`,
                body: `${message.author.username}: ${message.content?.slice(0, 100) || ""}`,
                color: "#ED4245"
            });
        }
    },

    start() {
        console.log("%c[ShowAllPings] ✅ Loaded with Ping History modal!", "color: #ED4245; font-weight: bold");
    }
});
