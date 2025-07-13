import fs from 'node:fs';
import path from 'node:path';

const isFile = fileName => {
  return fs.lstatSync(fileName).isFile();
};

export interface Post {
    date: string,
    text: string,
    path: string,
    link: string
}

export default function findPosts(folderpath: string): Post[] {
    return fs
        .readdirSync(folderpath)
        .map(fileName => {
            let parts = fileName.split(/[_\.]/);
            return {
                date: parts[0],
                text: `${parts[0]} - ${parts[1]}`,
                path: path.join(folderpath, fileName),
                link: path.join('/', folderpath, fileName)
            }
        })
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter(e => isFile(e.path));
}

