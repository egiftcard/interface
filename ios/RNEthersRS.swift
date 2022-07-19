//
//  RNEthers.swift
//  Uniswap
//
//  Created by Connor McEwen on 10/28/21.

/**
 Provides the generation, storage, and signing logic for mnemonics and private keys so that they never passed to JS.
 
 Mnemonics and private keys are stored and accessed in the native iOS secure keychain key-value store via associated keys formed from concatenating a constant prefix with the associated public address.
 
 Uses KeychainSwift as a wrapper utility to interface with the native iOS secure keychain. */

import Foundation

// TODO(cmcewen): move constants to another file
let prefix = "com.uniswap.mobile.dev"
let mnemonicPrefix = ".mnemonic."
let privateKeyPrefix = ".privateKey."
let entireMnemonicPrefix = prefix + mnemonicPrefix
let entirePrivateKeyPrefix = prefix + privateKeyPrefix

enum RNEthersRSError: Error {
  case storeMnemonicError
  case retrieveMnemonicError
  case iCloudError
}

@objc(RNEthersRS)

class RNEthersRS: NSObject {
  private let keychain = KeychainSwift(keyPrefix: prefix)
  // TODO: LRU cache to ensure we don't create too many (unlikely to happen)
  private var walletCache: [String: OpaquePointer] = [:]
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  /**
   Fetches all mnemonic IDs, which are used as keys to access the actual mnemonics in the native keychain secure key-value store.
   
   - returns: array of mnemonic IDs
   */
  @objc(getMnemonicIds:reject:)
  func getMnemonicIds(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let mnemonicIds = keychain.allKeys.filter { key in
      key.contains(mnemonicPrefix)
    }.map { key in
      key.replacingOccurrences(of: entireMnemonicPrefix, with: "")
    }
    resolve(mnemonicIds)
  }
  
  /**
   Derives private key from mnemonic with derivation index 0 and retrieves associated public address. Stores imported mnemonic in native keychain with the mnemonic ID key as the public address.
   
   - parameter mnemonic: The mnemonic phrase to import
   - returns: public address from the mnemonic's first derived private key
   */
  @objc(importMnemonic:resolve:reject:)
  func importMnemonic(
    mnemonic: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let private_key = private_key_from_mnemonic(
      mnemonic, UInt32(exactly: 0)!)
    let address = String(cString: private_key.address!)
    
    let res = storeNewMnemonic(mnemonic: mnemonic, address: address)
    if res != nil {
      resolve(res)
      return
    }
    let err = NSError.init()
    reject("error", "error", err)
    return
  }
  
  /**
   Generates a new mnemonic and retrieves associated public address. Stores new mnemonic in native keychain with the mnemonic ID key as the public address.
   
   - returns: public address from the mnemonic's first derived private key
   */
  @objc(generateAndStoreMnemonic:reject:)
  func generateAndStoreMnemonic(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let mnemonic_ptr = generate_mnemonic()
    let mnemonic_str = String(cString: mnemonic_ptr.mnemonic!)
    let address_str = String(cString: mnemonic_ptr.address!)
    let res = storeNewMnemonic(mnemonic: mnemonic_str, address: address_str)
    mnemonic_free(mnemonic_ptr)
    resolve(res)
  }
  
  /**
   Stores mnemonic phrase in Native Keychain under the address
   
   - returns: public address if successfully stored in native keychain
   */
  func storeNewMnemonic(mnemonic: String, address: String) -> String? {
    let newMnemonicKey = keychainKeyForMnemonicId(mnemonicId: address);
    let checkStored = retrieveMnemonic(mnemonicId: newMnemonicKey)
    
    if checkStored == nil {
      keychain.set(mnemonic, forKey: newMnemonicKey)
      return address
    }
    
    return nil
  }
  
  func keychainKeyForMnemonicId(mnemonicId: String) -> String {
    return mnemonicPrefix + mnemonicId
  }
  
  func retrieveMnemonic(mnemonicId: String) -> String? {
    return keychain.get(keychainKeyForMnemonicId(mnemonicId: mnemonicId))
  }
  
  /**
   Fetches all public addresses from private keys stored under `privateKeyPrefix` in native keychain. Used from React Native to verify the native keychain has the private key for an account that is attempting create a NativeSigner that calls native signing methods
   
   - returns: public addresses for all stored private keys
   */
  @objc(getAddressesForStoredPrivateKeys:reject:)
  func getAddressesForStoredPrivateKeys(
    resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock
  ) {
    let addresses = keychain.allKeys.filter { key in
      key.contains(privateKeyPrefix)
    }.map { key in
      key.replacingOccurrences(of: entirePrivateKeyPrefix, with: "")
    }
    resolve(addresses)
  }
  
  func storeNewPrivateKey(address: String, privateKey: String) {
    let newKey = keychainKeyForPrivateKey(address: address);
    keychain.set(privateKey, forKey: newKey)
  }
  
  /**
   Derives private key and public address from mnemonic associated with `mnemonicId` for given `derivationIndex`. Stores the private key in native keychain with key.
   
   - parameter mnemonicId: key string associated with mnemonic to generate private key for (currently convention is to use public address associated with mnemonic)
   - parameter derivationIndex: number used to specify a which derivation index to use for deriving a private key from the mnemonic
   - returns: public address associated with private key generated from the mnemonic at given derivation index
   */
  @objc(generateAndStorePrivateKey:derivationIndex:resolve:reject:)
  func generateAndStorePrivateKey(
    mnemonicId: String, derivationIndex: Int, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let mnemonic = retrieveMnemonic(mnemonicId: mnemonicId)
    let private_key = private_key_from_mnemonic(
      mnemonic, UInt32(exactly: derivationIndex)!)
    let xprv = String(cString: private_key.private_key!)
    let address = String(cString: private_key.address!)
    storeNewPrivateKey(address: address, privateKey: xprv)
    private_key_free(private_key)
    resolve(address)
  }
  
  /**
   Stores mnemonic to iCloud Documents
   
   - parameter mnemonicId: key string associated with mnemonic to backup
   - parameter pin: optional user provided pin to encrypt the mnemonic, interprets as no pin if empty string 
   - returns: boolean for success
   */
  @objc(backupMnemonicToICloud:pin:resolve:reject:)
  func backupMnemonicToICloud(
    mnemonicId: String, pin: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    guard let mnemonic = retrieveMnemonic(mnemonicId: mnemonicId) else {
      return reject("retrieve-mnemonic-error", "Failed to retrieve mnemonic", RNEthersRSError.retrieveMnemonicError)
    }
    
    let isPinEncrypted = pin != ""
    if (isPinEncrypted) {
      // TODO: encrypt mnemonic with pin
    }
    
    // Access iCloud Documents container
    // TODO: Temporarily appending "Documents" path to make file visible in iCloud Files for easier debugging
    guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil)?.appendingPathComponent("Documents") else {
      return reject("icloud-error", "Failed to find iCloud container", RNEthersRSError.iCloudError)
    }
    
    // Create iCloud container if empty
    if !FileManager.default.fileExists(atPath: containerUrl.path, isDirectory: nil) {
      do {
        try FileManager.default.createDirectory(at: containerUrl, withIntermediateDirectories: true, attributes: nil)
      }
      catch {
        return reject("icloud-error", "Failed to create iCloud container", RNEthersRSError.iCloudError)
      }
    }
    
    // Write backup file to iCloud
    let iCloudFileURL = containerUrl.appendingPathComponent("\(mnemonicId).json")
    do {
      let backup = ICloudMnemonicBackup(mnemonicId: mnemonicId, mnemonic: mnemonic, isPinEncrypted: isPinEncrypted, createdAt: Date().timeIntervalSince1970)
      try JSONEncoder().encode(backup).write(to: iCloudFileURL)
      return resolve(true)
    }
    catch {
      return reject("icloud-error", "Failed to write backup file to iCloud", RNEthersRSError.iCloudError)
    }
  }
  
  @objc(signTransactionHashForAddress:hash:chainId:resolve:reject:)
  func signTransactionForAddress(
    address: String, hash: String, chainId: NSNumber, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let wallet = retrieveOrCreateWalletForAddress(address: address)
    let signedHash = sign_tx_with_wallet(wallet, hash, UInt64(chainId))
    let result = String(cString: signedHash.signature!)
    resolve(result);
  }
  
  @objc(signMessageForAddress:message:resolve:reject:)
  func signMessageForAddress(
    address: String, message: String, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let wallet = retrieveOrCreateWalletForAddress(address: address)
    let signedMessage = sign_message_with_wallet(wallet, message)
    let result = String(cString: signedMessage!)
    string_free(signedMessage)
    resolve(result)
  }
  
  @objc(signHashForAddress:hash:chainId:resolve:reject:)
  func signHashForAddress(
    address: String, hash: String, chainId: NSNumber, resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let wallet = retrieveOrCreateWalletForAddress(address: address)
    let signedHash = sign_hash_with_wallet(wallet, hash, UInt64(chainId))
    let result = String(cString: signedHash!)
    string_free(signedHash)
    resolve(result)
  }
  
  func retrieveOrCreateWalletForAddress(address: String) -> OpaquePointer {
    if walletCache[address] != nil {
      return walletCache[address]!
    }
    let privateKey = retrievePrivateKey(address: address)
    let wallet = wallet_from_private_key(privateKey)
    walletCache[address] = wallet
    return wallet!
  }
  
  func retrievePrivateKey(address: String) -> String? {
    return keychain.get(keychainKeyForPrivateKey(address: address))
  }
  
  func keychainKeyForPrivateKey(address: String) -> String {
    return privateKeyPrefix + address
  }
}
