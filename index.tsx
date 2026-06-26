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
                <Text variant="heading-lg/semibold">Ping History ({pings.length})</Text>
            </ModalHeader>
            <ModalContent>
                <ScrollerThin style={{ maxHeight: "500px" }}>
                    {pings.length === 0 ? (
                        <Text variant="text-md/normal" style={{ textAlign: "center", padding: "30px" }}>
                            No pings recorded yet.
                        </Text>
                    ) : (
                        pings.slice().reverse().map((ping, i) => (
                            <div key={i} style={{
                                padding: "12px",
                                margin: "6px 0",
                                backgroundColor: "var(--background-secondary)",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }} onClick={() => {
                                FluxDispatcher.dispatch({ type: "CHANNEL_SELECT", guildId: ping.guildId, channelId: ping.channelId });
                                modalProps.onClose();
                            }}>
                                <div style={{ color: "#ED4245", fontWeight: "bold" }}>
                                    {ping.pingType} — {ping.timestamp.toLocaleTimeString()}
                                </div>
                                <div><strong>{ping.author}</strong> • {ping.guildName ?? "DMs"}</div>
                                <div style={{ opacity: 0.85 }}>{ping.content}</div>
                            </div>
                        ))
                    )}
                </ScrollerThin>
            </ModalContent>
            <ModalFooter>
                <Button color={Button.Colors.RED} onClick={() => { pings = []; modalProps.onClose(); }}>Clear</Button>
                <Button onClick={modalProps.onClose}>Close</Button>
            </ModalFooter>
        </ModalRoot>
    );
}

export default definePlugin({
    name: "ShowAllPings",
    description: "Shows notifications for every ping + Toolbar button with history",
    authors: [{ name: "YourName", id: 0n }],

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
        MESSAGE_CREATE(event: any) {
            const { message, channelId, optimistic } = event;

            console.log("[ShowAllPings] MESSAGE_CREATE received", {
                hasMentionEveryone: message?.mention_everyone,
                contentHasEveryone: /@everyone/i.test(message?.content || ""),
                author: message?.author?.username
            });

            if (optimistic || message?.author?.bot) return;

            const currentUser = FluxDispatcher.getStore("UserStore").getCurrentUser();
            if (!currentUser || message.author?.id === currentUser.id) return;

            const isMention = message.mentions?.some((m: any) => m.id === currentUser.id);
            const isEveryone = message.mention_everyone || /@everyone/i.test(message.content || "");
            const isHere = /@here/i.test(message.content || "");

            const isPing = isMention || isEveryone || isHere;

            if (!isPing) return;

            console.log("[ShowAllPings] 🔥 Ping detected!", { isEveryone, isHere, isMention });

            const pingType = isEveryone ? "@everyone" : isHere ? "@here" : "@mention";

            const guild = FluxDispatcher.getStore("GuildStore").getGuild(message.guild_id);
            const channel = FluxDispatcher.getStore("ChannelStore").getChannel(channelId);

            const ping: Ping = {
                id: message.id,
                timestamp: new Date(),
                pingType,
                author: message.author.username,
                content: message.content?.slice(0, 150) || "(no text)",
                guildName: guild?.name,
                channelName: channel?.name,
                channelId,
                guildId: message.guild_id
            };

            pings.unshift(ping);
            if (pings.length > 50) pings.pop();

            showNotification({
                title: `${pingType} in ${guild?.name ?? "DMs"}`,
                body: `${message.author.username}: ${message.content?.slice(0, 100) || ""}`,
                color: "#ED4245"
            });
        }
    },

    start() {
        console.log("%c[ShowAllPings] ✅ Plugin loaded with improved @everyone detection", "color: #ED4245; font-weight: bold");
    }
});
