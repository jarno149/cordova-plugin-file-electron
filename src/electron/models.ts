import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readdirSync, writeFileSync } from 'fs'
import { join, parse } from 'path'
import { moveSync, copySync, rmSync } from 'fs-extra'

export class FileSystem {
    public root: DirectoryEntry
    constructor(public name: string, root: DirectoryEntry = null) {
        if(root) {
            this.root = new DirectoryEntry(root.nativeURL, this)
        }
        else {
            this.root = new DirectoryEntry('/', this)
        }
    }
}

export class MetaData {
    constructor(
        public modificationTime: Date,
        public size: number
    ) {}

    public static fromUrl(url: string): MetaData {
        if(!existsSync(url))
            return null
        let stat = lstatSync(url)
        return new MetaData(new Date(stat.mtime), stat.size)
    }
}

export class Entry {
    public isFile: boolean
    public isDirectory: boolean
    public name: string
    public fullPath: string
    public filesystem: FileSystem
    public nativeURL: string

    constructor(url: string, fileSystem: FileSystem) {
        this.init(url, fileSystem)
    }

    private init(url: string, fileSystem: FileSystem) {
        this.name = parse(url).name
        let extension = parse(url).ext
        if(extension && extension.length > 0)
            this.name += extension
        this.fullPath = url
        this.filesystem = fileSystem
        this.nativeURL = url
        if(existsSync(url)) {
            let stat = lstatSync(url)
            this.isFile = stat.isFile()
            this.isDirectory = stat.isDirectory()
        }
    }
    
    public getMetadata(): MetaData {
        return MetaData.fromUrl(this.nativeURL)
    }

    public setMetadata() {
        throw new Error('NOT IMPLEMENTED!')
    }

    public moveTo(parent: DirectoryEntry, newName: string = null): Entry {
        let currentDir = parse(this.nativeURL).dir
        let targetDir = parse(parent.nativeURL).dir

        let source = join(currentDir, this.name)
        let target = join(targetDir, newName ? newName : this.name)
        moveSync(source, target)
        return new Entry(target, this.filesystem)
    }

    public copyTo(parent: DirectoryEntry, newName: string = null): Entry {
        let currentDir = parse(this.nativeURL).dir
        let targetDir = parse(parent.nativeURL).dir

        let source = join(currentDir, this.name)
        let target = join(targetDir, newName ? newName : this.name)
        copySync(source, target)
        return new Entry(target, this.filesystem)
    }

    public toInternalURL(): string {
        return this.nativeURL
    }

    public toURL(): string {
        return this.nativeURL
    }

    public remove() {
        rmSync(this.nativeURL, { recursive: true })
    }
}

export class DirectoryReader {
    constructor(public dir: DirectoryEntry) {}

    public readEntries(): Entry[] {
        return readdirSync(this.dir.nativeURL)
            .map(e => {
                let fullPath = join(this.dir.nativeURL, e)
                let stat = lstatSync(fullPath)
                if(stat.isDirectory())
                    return new DirectoryEntry(fullPath, this.dir.filesystem)
                else return new FileEntry(fullPath, this.dir.filesystem)
            })
    }
}

export class DirectoryEntry extends Entry {
    
    constructor(url: string, fileSystem: FileSystem) {
        super(url, fileSystem)
    }

    public createReader(): DirectoryReader {
        return new DirectoryReader(this)
    }

    public getDirectory(path: string, options: { create: boolean }): DirectoryEntry {
        let fullPath = join(this.nativeURL, path)
        let exists = existsSync(fullPath)
        if(options.create && !exists) {
            mkdirSync(fullPath, { recursive: true })
            exists = true
        }
        if(exists)
            return new DirectoryEntry(fullPath, this.filesystem)
        return undefined
    }

    public removeRecursively() {
        rmSync(this.nativeURL, { recursive: true })
    }

    public getFile(path: string, options: { create: boolean }): FileEntry {
        let fullPath = join(this.nativeURL, path)
        let exists = existsSync(fullPath)
        if(options.create && !exists) {
            closeSync(openSync(fullPath, 'w'))
            exists = true
        }
        if(exists)
            return new FileEntry(fullPath, this.filesystem)
        return undefined
    }
}

export class File {
    public name: string
    public localURL: string
    public type: string
    public lastModified: Date
    public lastModifiedDate: Date
    public size: number
    public start: number
    public end: number
    
    constructor(url: string) {
        let stat = lstatSync(url)
        let p = parse(url)
        this.name = p.name
        this.localURL = url
        this.type = p.ext
        this.lastModified = stat.mtime
        this.lastModifiedDate = stat.mtime
        this.size = stat.size
        this.start = 0
        this.end = this.size
    }
}

export class FileWriter {
    constructor(public file: File) {}

    public async write(data: string | Blob, isPendingBlobReadResult: boolean) {
        let buffer: Buffer
        if(data instanceof Blob) {
            buffer = Buffer.from(await data.arrayBuffer())
        }
        else if (typeof data === 'string') {
            buffer = Buffer.from(data, 'utf8')
        }
        writeFileSync(this.file.localURL, buffer)
    }

    public seek() {
        throw new Error('NOT IMPLEMENTED!')
    }

    public truncate() {
        throw new Error('NOT IMPLEMENTED!')
    }
}

export class FileEntry extends Entry {

    constructor(url: string, fileSystem: FileSystem) {
        super(url, fileSystem)
        this.isFile = true
        this.isDirectory = false
    }    

    public createWriter(): FileWriter {
        return new FileWriter(this.file())
    }

    public file(): File {
        return new File(this.nativeURL)
    }
}