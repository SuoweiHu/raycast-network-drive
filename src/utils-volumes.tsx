

// * e.g.
// * exec(`smbutil view -g //suowei.h:XXXXXX@XXXX.XXX.XX.XX`, (err, stdout, stderr) => {
// *     let disks = smbutil_output_format(stdout);
// *     disks.forEach((disk) => {console.log(disk);})

import { exec } from "child_process";
import { get_pref_smb_ip, get_pref_smb_pwd, get_pref_smb_usr } from "./utils-preference";
import { confirmAlert } from "@raycast/api";

// * });
function smbutil_output_format(stdout: string): string[] {
    try {
        let lines = stdout.split('\n');
        let str_array = [];
        for (let i = 3; i < lines.length; i++) {
            if (lines[i].includes("Disk")) {
                let shareName = lines[i].split(/[ ]{2,}/)[0].trim();
                str_array.push(shareName);
            }
        }
        return str_array;
    } catch (err) {
        return [];
    }
}

// * e.g.
// * exec(`/opt/homebrew/bin/smbclient -L //XXXX.XX.XX.XXX --grepable --user=suowei.h --password=XXXXX --workgroup=WORKGROUP`, (err, stdout, stderr) => {
// *     let disks = smbclient_output_format(stdout);
// *     disks.forEach((disk) => { console.log(disk); })
// * });
function smbclient_output_format(stdout: string): string[] {
    try {
        let str_array: string[] = [];
        const lines = stdout.split('\n');
        lines.forEach(line => {
            if (line.startsWith('Disk')) {
                const parts = line.split('|');
                if (parts.length > 1) { str_array.push(parts[1]); }
            }
        });
        return str_array;
        ;
    } catch (err) {
        return [];
    }
}

// * e.g.
// * let [volumes, set_volumes] = useState<string[]>([])
// * useEffect(() => {smbclient_getVolumes(set_volumes)}, []);
export async function smbclient_getVolumes(setter: Function) {
    let ip: string = get_pref_smb_ip();
    let usr: string = get_pref_smb_usr();
    let pwd: string = get_pref_smb_pwd();
    exec(
        `/opt/homebrew/bin/smbclient -L //${ip} --grepable --user=${usr} --password=${pwd} --workgroup=WORKGROUP`,
        async (err, stdout, stderr) => {
            if (err) {
                console.log("Failure fetching db" + stderr);
                if (stderr.includes(`/opt/homebrew/bin/smbclient: No such file or directory`)) {
                    await confirmAlert({ title: "You have not installed samba", message: "Please installed it via `brew install samba`.", });
                }
            } else { setter(smbclient_output_format(stdout)); }
        }
    );
}