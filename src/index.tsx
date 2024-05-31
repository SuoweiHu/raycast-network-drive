import { ActionPanel, Action, List, showToast, showHUD, Toast, Icon, Color } from "@raycast/api";
import { exec } from "child_process";
import { useEffect, useState } from "react";
import { get_pref_smb_ip } from "./utils-preference";
import { delayOperation, getNetworkDrives, getNetworkDrivesMounted } from "./utils-drive";

function DriveItem(props: { vol: string; mounted_vols: string[] }) {
    const mnt = props.mounted_vols.includes(props.vol);
    return (
        <List.Item
            title={props.vol}
            actions={<List_SMB_ActionPanel vol={props.vol} mounted_vols={props.mounted_vols} />}
            icon={mnt?{source:Icon.CheckCircle, tintColor:Color.Green}:{source:Icon.Circle}}
        />
    );
}

function List_SMB_ActionPanel(props: { vol: string; mounted_vols: string[] }) {
    return (
        <ActionPanel>
            <Action
                title="Mount"
                onAction={async () => {
                    showToast({ title: "Mounting...", style: Toast.Style.Animated });
                    await delayOperation(1000);
                    exec(`osascript -e 'mount volume "smb://${get_pref_smb_ip()}/${props.vol}"'`, async (err) => {
                        if (err) {
                            showHUD("Action Failed ⚠️");
                        }
                        exec(`open "/Volumes/${props.vol}"`);
                        showHUD(`Mounted  [${props.vol}]  🚀🌖`);
                    });
                }}
            ></Action>
            <Action
                title="Unmount"
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={async () => {
                    showToast({ title: "Un-Mounting...", style: Toast.Style.Animated });
                    await delayOperation(1000);
                    exec(`/usr/sbin/diskutil unmount "/Volumes/${props.vol}"`, async (_err, stdout) => {
                        if (!stdout.includes("Unmount successful")) {
                            showHUD("Action Failed ⚠️");
                        } else {
                            showHUD(`Unmounted  [${props.vol}]  🪂🌍`);
                        }
                    });
                }}
            ></Action>
            <Action
                title="Unmount All"
                shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
                onAction={async () => {
                    showToast({ title: "Un-Mounting All...", style: Toast.Style.Animated });
                    await delayOperation(1000);
                    props.mounted_vols.forEach((_vol_) => {
                        exec(`/usr/sbin/diskutil unmount "/Volumes/${_vol_}"`, async (err) => {
                            if (err) {
                                showHUD("Action Failed ⚠️");
                            }
                            showHUD("Unmounted  All  🪂🌍");
                        });
                    });
                }}
            ></Action>
        </ActionPanel>
    );
}

export default function Command() {
    const [network_drivess,         set_networkDrives] = useState<string[]>([]);
    const [network_volumes_mounted, set_networkDrivesMounted] = useState<string[]>([]);
    useEffect(() => {
        getNetworkDrives(set_networkDrives);
        getNetworkDrivesMounted(set_networkDrivesMounted);
    }, []);

    return(
        <List isLoading={network_drivess==undefined||network_volumes_mounted==undefined}>
            {network_drivess?.map((drive) => <DriveItem vol={drive} mounted_vols={network_volumes_mounted} key={drive} />)}
        </List>
    );
}
