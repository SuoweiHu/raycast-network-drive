import { ActionPanel, Action, Icon, List, Detail, confirmAlert, Alert, useNavigation, showToast, showHUD, Toast } from "@raycast/api";
import { exec } from "child_process";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { get_pref_smb_ip, get_pref_smb_pwd, get_pref_smb_usr } from "./utils-preference";
import { smbclient_getVolumes } from "./utils-volumes";

// DELAY HELPER FUNCTION
function delay(milliseconds:number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// TOP LEVEL LIST
function List_SMB_Volumes() {
    let [volumes, set_volumes] = useState<string[]>([])
    useEffect(() => { smbclient_getVolumes(set_volumes) }, []);
    return (
        <List isLoading={volumes.length == 0}>
            {volumes?.map((volume) => <List_SMB_VolumeItem vol={volume} vols={volumes} key={volume} />)}
        </List>
    );
}

// MID LEVEL LIST.ITEM
function List_SMB_VolumeItem(props: { vol: string, vols:string[] }) {
    return (
        <List.Item
            title={props.vol}
            key={props.vol}
            actions={
                <List_SMB_ActionPanel vol={props.vol} vols={props.vols}/>
            }
        />
    );
}

// BOTTOM LEVEL ACTIONS
function List_SMB_ActionPanel(props:{vol:string,vols:string[]}){
    return(
        <ActionPanel>
            <Action
                title="Mount"
                shortcut={{ modifiers: [], key: "enter" }}
                onAction={async () => {
                    showToast({title:"Mounting...", style:Toast.Style.Animated});
                    await delay(1000);
                    exec(`osascript -e 'mount volume "smb://${get_pref_smb_ip()}/${props.vol}"'`, async (err, stdout, stderr) => {
                        if (err) {showHUD("UN-MOUNTED FAILURE !")}
                        exec(`open "/Volumes/${props.vol}"`);
                        showHUD("MOUNTED 🚀🌖")
                    });
                }}
            ></Action>
            <Action
                title="Unmount"
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={async () => {
                    showToast({title:"Un-Mounting...", style:Toast.Style.Animated});
                    await delay(1000);
                    exec(`/usr/sbin/diskutil unmount "/Volumes/${props.vol}"`, async (err, stdout, stderr) => {
                        if(stdout.includes("Unmount successful")){showHUD("UN-MOUNTED 🪂🌍")}
                        else{showHUD("UN-MOUNTED FAILURE !")}
                    });
                }}
            ></Action>
            <Action
                title="Unmount All"
                shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
                onAction={async () => {
                    showToast({title:"Un-Mounting All...", style:Toast.Style.Animated});
                    await delay(1000);
                    props.vols.forEach((_vol_)=>{
                        exec(`/usr/sbin/diskutil unmount unmount "/Volumes/${_vol_}"`, async (err, stdout, stderr) => {
                            if (err) {showHUD("UN-MOUNTED ALL FAILURE !")}
                            showHUD("UN-MOUNTED 🪂🌍")
                        });
                    })
                }}
            ></Action>
        </ActionPanel>
    );
}

// EXPORT DEFAULT FUNCTION
export default function Command() { return (<List_SMB_Volumes />) }