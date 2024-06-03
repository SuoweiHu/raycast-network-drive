import { exec } from "child_process";
import { Dispatch, SetStateAction } from "react";
import { get_pref_smb_ip, get_pref_smb_usr } from "./utils-preference";

// ██████████████████████████████████████████████████████████████████████████████

export type DiskInfo = {
    filesystem: string;
    "1G-blocks": number;
    used: number;
    available: number;
    capacity: string;
    iused: number;
    ifree: number;
    percentIused: string;
    mountedOn: string;
};

function parseDiskUsage(output: string): DiskInfo[] {
    const lines = output.split("\n");
    lines.pop();    // Remove the last empty line if present
    const data = lines.map(line => {
        const columns = line.trim().split(/\s+/);
        return {
            filesystem: decodeURI(columns[0]),
            "1G-blocks": parseInt(columns[1], 10),
            used: parseInt(columns[2], 10),
            available: parseInt(columns[3], 10),
            capacity: columns[4],
            iused: parseInt(columns[5], 10),
            ifree: parseInt(columns[6], 10),
            percentIused: columns[7],
            mountedOn: columns.slice(8).join(' ')
        } as DiskInfo;
    });
    return data;
}

// ██████████████████████████████████████████████████████████████████████████████

export type MountedDisk_Mapping={
    network_source:   string, //e.g. "//suowei.h@example.com/drive_name"
    mounted_location: string, //e.g. "/Volumes/drive_name-1"
}

function parseNetworkDiskMount(stdout:string):MountedDisk_Mapping[]{
    let rtn_mounteddisk_mapping:MountedDisk_Mapping[]=[];
    const stdout_decode = decodeURI(stdout);
    const stdout_decode_lines = stdout_decode.split("\n");
    stdout_decode_lines.forEach((line)=>{
        if(line.length!=0){
            const _src   = line.split(" on ")[0];
            const _loc = line.split(" on ")[1].split(" (")[0];
            rtn_mounteddisk_mapping.push({network_source: _src,mounted_location:_loc})
        }
    });
    return rtn_mounteddisk_mapping;
}

// ██████████████████████████████████████████████████████████████████████████████


export async function getNetworkDrivesInfo(set_data: Dispatch<SetStateAction<DiskInfo[]|undefined>>) {
    let _filesystem_ = get_pref_smb_usr()+"@"+get_pref_smb_ip();
    exec(`/sbin/mount | /usr/bin/grep --context=0 ${_filesystem_}`, (_err, stdout: string) => {
        const parsed_data_1 = parseNetworkDiskMount(stdout);
        console.log(parsed_data_1.map((i)=>{return i.mounted_location}));
        exec(`/bin/df -c -g | /usr/bin/grep --context=0 "${_filesystem_}"`, (_err, stdout) => {
            let parsed_data_2 = parseDiskUsage(stdout);
            parsed_data_2.forEach((item)=>{
                const mounted_locations = parsed_data_1.map((i)=>{return i.mounted_location});
                const network_sources   = parsed_data_1.map((i)=>{return i.network_source});
                const index             = network_sources.indexOf(item.filesystem);
                const mounted_loc       = mounted_locations[index];
                item.mountedOn = mounted_loc;
            });
            console.log(parsed_data_2);
            set_data(parsed_data_2);

        });
    });
}

// ██████████████████████████████████████████████████████████████████████████████
