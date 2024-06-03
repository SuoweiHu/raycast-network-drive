import { ActionPanel, Action, List, showToast, showHUD, Toast, Icon, Color, confirmAlert } from "@raycast/api";
import { exec } from "child_process";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { get_pref_smb_ip } from "./utils-preference";
import { delayOperation } from "./utils-other";
import { checkMountedState, findMountedName, getNetworkDrivesMounted_ } from "./utils-disk-mount"
import { getNetworkDrives } from "./utils-disk-network";
import { DiskInfo, getNetworkDrivesInfo } from "./utils-disk-info"

export default function Command() {

    // React init hooks and variables (fetch required data)
    const [network_drivess, set_networkDrives] = useState<string[]>([]);
    const [network_volumes_mounted, set_networkDrivesMounted] = useState<string[]>([]);
    const [need_update, set_update] = useState<boolean>(false);
    useEffect(() => {
        getNetworkDrives(set_networkDrives);
        getNetworkDrivesMounted_(set_networkDrivesMounted);
        set_update(false);
    }, [need_update]);

    // Render the list based on the data retrived
    return (
        <List isLoading={network_drivess.length==0}>
            {network_drivess?.map((drive) => (
                <DriveItem key={drive} vol={drive} mounted_vols={network_volumes_mounted} set_update={set_update} />
            ))}
        </List>
    );
}

// ██████████████████████████████████████████████████████████████████████████████


function DriveItem(props: { vol: string; mounted_vols: string[]; set_update: Dispatch<SetStateAction<boolean>> }) {
    const mnt = checkMountedState(props.vol, props.mounted_vols);
    return (
        <List.Item
            title={props.vol}
            actions={<DriveActions vol={props.vol} mounted_vols={props.mounted_vols} set_update={props.set_update} />}
            icon={mnt ? { source: Icon.CheckCircle, tintColor: Color.Green } : { source: Icon.Circle }}
        />
    );
}

function DriveActions(props: { vol: string; mounted_vols: string[]; set_update: Dispatch<SetStateAction<boolean>> }) {
    return (
        <ActionPanel>
            <ActionPanel.Section title="Quick Option">
                <Action
                    title="Mount/Unmount"
                    onAction={async () => {
                        const mouned = checkMountedState(props.vol, props.mounted_vols);
                        if (!mouned) {
                            showToast({ title: "Mounting...", style: Toast.Style.Animated });
                            await delayOperation(1000);
                            exec(`osascript -e 'mount volume "smb://${get_pref_smb_ip()}/${props.vol}"'`, async (err) => {
                                if (err) {
                                    showToast({ title: "Action Failed" });
                                }
                                showToast({ title: `${props.vol}  Mounted` });
                                props.set_update(true);
                            });
                        } else {
                            showToast({ title: "Unmounting...", style: Toast.Style.Animated });
                            await delayOperation(1000);
                            if (!checkMountedState(props.vol, props.mounted_vols)) {
                                showToast({ title: `${props.vol} is Already Unmounted`, style: Toast.Style.Failure });
                            } else {
                                exec(
                                    `/usr/sbin/diskutil unmount "${findMountedName(props.vol, props.mounted_vols)}"`,
                                    async (_err, stdout) => {
                                        if (!stdout.includes("Unmount successful")) {
                                            showToast({ title: "Action Failed", style: Toast.Style.Failure });
                                        } else {
                                            showToast({ title: `${props.vol} Unmounted`, style: Toast.Style.Success });
                                        }
                                        props.set_update(true);
                                    },
                                );
                            }
                        }
                    }}
                ></Action>
                <Action
                    title="Mount and Open"
                    onAction={async () => {
                        showToast({ title: "Mounting...", style: Toast.Style.Animated });
                        await delayOperation(1000);
                        exec(`osascript -e 'mount volume "smb://${get_pref_smb_ip()}/${props.vol}"'`, async (err) => {
                            if (err) {
                                showHUD("Action Failed ⚠️");
                            }
                            exec(`open "${findMountedName(props.vol, props.mounted_vols)}"`);
                            showHUD(`Mounted  [${props.vol}]  🚀🌖`);
                        });
                    }}
                ></Action>
                <Action
                    title="Unmount All"
                    shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
                    onAction={async () => {
                        if (
                            await confirmAlert({
                                icon: Icon.AlarmRinging,
                                title: `Are you sure you want to \n "Unmount All Drives" ?`,
                            })
                        ) {
                            showToast({ title: "Unmounting All...", style: Toast.Style.Animated });
                            await delayOperation(1000);
                            if (!(props.mounted_vols == undefined || props.mounted_vols.length == 0)) {
                                props.mounted_vols.forEach((_vol_) => {
                                    exec(`/usr/sbin/diskutil unmount "${findMountedName(_vol_, props.mounted_vols)}"`, async (err) => {
                                        if (err) {
                                            showToast({ title: "Action Failed", style: Toast.Style.Failure });
                                        }
                                        showHUD("Unmounted All  🪂🌍");
                                        props.set_update(true);
                                    });
                                });
                            } else {
                                showHUD("Unmounted All  🪂🌍");
                            }
                        }
                    }}
                ></Action>
            </ActionPanel.Section>
            <ActionPanel.Section title="Specific Option">
                <Action
                    title="Mount"
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                    onAction={async () => {
                        showToast({ title: "Mounting...", style: Toast.Style.Animated });
                        await delayOperation(1000);
                        exec(`osascript -e 'mount volume "smb://${get_pref_smb_ip()}/${props.vol}"'`, async (err) => {
                            if (err) {
                                showToast({ title: "Action Failed" });
                            }
                            showToast({ title: `${props.vol} Mounted` });
                            props.set_update(true);
                        });
                    }}
                ></Action>
                <Action
                    title="Unmount"
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={async () => {
                        showToast({ title: "Unmounting...", style: Toast.Style.Animated });
                        await delayOperation(1000);
                        if (!props.mounted_vols.includes(props.vol)) {
                            showToast({ title: `${props.vol} is Already Unmounted`, style: Toast.Style.Failure });
                        } else {
                            exec(
                                `/usr/sbin/diskutil unmount "${findMountedName(props.vol, props.mounted_vols)}"`,
                                async (_err, stdout) => {
                                    if (!stdout.includes("Unmount successful")) {
                                        showToast({ title: "Action Failed", style: Toast.Style.Failure });
                                    } else {
                                        showToast({ title: `${props.vol} Unmounted`, style: Toast.Style.Success });
                                    }
                                    props.set_update(true);
                                },
                            );
                        }
                    }}
                ></Action>
            </ActionPanel.Section>
        </ActionPanel>
    );
}
