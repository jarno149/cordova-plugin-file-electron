
import { appendFileSync, closeSync, open, openSync, readFileSync, readSync, writeFileSync, writeSync } from 'fs'
import { join, parse } from 'path'
import { DirectoryEntry, Entry, FileEntry, FileSystem, FileWriter, MetaData } from './models'
import { lookup } from 'mime-types'


const FILESYSTEMS = {
    applicationDirectory: join(__dirname, '..', '..', '..', '..', 'platforms', 'electron', 'www'),
    applicationStorageDirectory: join(__dirname, '..', '..', '..', '..', 'platforms', 'electron', 'www'),
    cacheDirectory: join(__dirname, 'cache'),
    dataDirectory: join(__dirname, 'data'),
}

const FileSystem_requestAllPaths = () => {
    return FILESYSTEMS
}

const FileSystems_requestAllFileSystems = () => {
    throw new Error('NOT IMPLEMENTED!')
}

const FileSystems_requestFileSystem = () => {
    throw new Error('NOT IMPLEMENTED!')
}

const FileSystems_resolveLocalFileSystemURI = ([args]: any[]) => {
    let entry = new Entry(args[0], null)
    if(entry.isDirectory)
        return new DirectoryEntry(args[0], null)
    return new FileEntry(args[0], null)
}

// Directory funcs
export const Directory_getDirectory = ([args]: any[]) => {
    return new DirectoryEntry(args[0], null)
}

export const Directory_removeRecursively = ([args]: any[]) => {
    let entry = new DirectoryEntry(args[0], null)
    entry.removeRecursively()
}

export const Directory_getFile = ([args]: any[]) => {
    let dirEntry = new DirectoryEntry(args[0], null)
    return dirEntry.getFile(args[1], args[2])
}

export const DirectoryReader_readEntries = ([args]: any[]) => {
    let entry = new DirectoryEntry(args[0], null)
    return entry.createReader().readEntries()
}

export const Entry_getMetadata = ([args]: any[]) => {
    let entry = new Entry(args[0], null)
    return entry.getMetadata()
}

export const Entry_setMetadata = ([args]: any[]) => {
    let entry = new Entry(args[0], null)
    // NOT IMPLEMENTED!
    entry.setMetadata()
}

export const Entry_moveTo = ([args]: any[]) => {
    let entry = new Entry(args[0], null)
    let parent = new DirectoryEntry(args[1], null)
    entry.moveTo(parent, args[2])
}

export const Entry_copyTo = ([args]: any[]) => {
    let entry = new Entry(args[0], null)
    let parent = new DirectoryEntry(args[1], null)
    entry.copyTo(parent, args[2])
}

export const Entry_remove = ([args]: any[]) => {
    let entry = new Entry(args[0], null)
    entry.remove()
}

export const Entry_getParent = ([args]: any[]) => {
    throw new Error('NOT IMPLEMENTED!')
}

export const File_getFileMetadata = ([args]: any[]) => {
    let entry = new FileEntry(args[0], null)
    return entry.getMetadata()
}

export const FileReader_readAsText = ([args]: any[]) => {
    let filepath = args[0]
    let encoding = args[1]

    return readFileSync(filepath, { encoding: encoding }).toString(encoding)
}

export const FileReader_readAsDataURL = ([args]: any[]) => {
    let filepath = args[0]

    let asText = readFileSync(filepath).toString('utf-8')
    let buff = Buffer.from(asText)
    let mimeType = lookup(parse(filepath).ext)
    if(!mimeType) {
        mimeType = 'application/octet-stream'
    }
    return `data:${mimeType};base64,${buff.toString('base64')}`
}

export const FileReader_readAsBinaryString = ([args]: any[]) => {
    let filepath = args[0]
    let buff = readFileSync(filepath)
    return buff
}

export const FileReader_readAsArrayBuffer = ([args]: any[]) => {
    let filepath = args[0]
    let buff = readFileSync(filepath)
    return buff
}

export const FileWriter_write = ([args]: any[]) => {
    let filepath = args[0]
    let data = args[1]
    let position = args[2]
    let isBinary = args[3]

    let buff = Buffer.from(data)
    
    // THIS DOESNT REALLY SEEK TO ANYTHING!
    if(position > 0)
        appendFileSync(filepath, buff, { encoding: isBinary ? 'binary' : 'utf8' })
    else writeFileSync(filepath, buff, { encoding: isBinary ? 'binary' : 'utf8' })
}

export const FileWriter_truncate = ([args]: any[]) => {
    console.error(args)
    throw new Error('NOT IMPLEMENTED!')
}


module.exports = {
   getDirectory: Directory_getDirectory,
   removeRecursively: Directory_removeRecursively,
   getFile: Directory_getFile,
   readEntries: DirectoryReader_readEntries,
   getMetadata: Entry_getMetadata,
   setMetadata: Entry_setMetadata,
   moveTo: Entry_moveTo,
   copyTo: Entry_copyTo,
   remove: Entry_remove,
   getParent: Entry_getParent,
   getFileMetadata: File_getFileMetadata,
   readAsText: FileReader_readAsText,
   readAsDataURL: FileReader_readAsDataURL,
   readAsBinaryString: FileReader_readAsBinaryString,
   readAsArrayBuffer: FileReader_readAsArrayBuffer,
   requestAllPaths: FileSystem_requestAllPaths,
   requestAllFileSystems: FileSystems_requestAllFileSystems,
   write: FileWriter_write,
   truncate: FileWriter_truncate,
   requestFileSystem: FileSystems_requestFileSystem,
   resolveLocalFileSystemURI: FileSystems_resolveLocalFileSystemURI
}