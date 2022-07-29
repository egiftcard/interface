//
//  RNICloudBackupsManager.swift
//  Uniswap
//
//  Created by Spencer Yen on 7/13/22.
//

import Foundation

struct ICloudMnemonicBackup: Codable {
  let mnemonicId: String
  let mnemonic: String
  let isPinEncrypted: Bool
  let createdAt: Double
}

enum ICloudManagerEventType: String, CaseIterable {
  case foundCloudBackup = "FoundCloudBackup"
}

@objc(RNICloudBackupsManager)
class RNICloudBackupsManager: RCTEventEmitter {
  
  private let backupsQuery = NSMetadataQuery()
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func supportedEvents() -> [String]! {
    return ICloudManagerEventType.allCases.map { $0.rawValue }
  }

  /**
   Determine if iCloud Documents is available on device
   
   - returns: boolean if iCloud Documents is available or not
   */
  @objc(isICloudAvailable:reject:)
  func isICloudAvailable(resolve: RCTPromiseResolveBlock,
                         reject: RCTPromiseRejectBlock
  ) {
    if FileManager.default.ubiquityIdentityToken == nil {
      return resolve(false)
    } else  {
      return resolve(true)
    }
  }
  
  /**
   Starts NSMetadataQuery to discover backup files stored in iCloud Documents. Initializes listeners to handle downloading and sending found backups to JS.
   
   Referenced sample implementation here: https://developer.apple.com/documentation/uikit/documents_data_and_pasteboard/synchronizing_documents_in_the_icloud_environment
   */
  @objc
  func startFetchingICloudBackups() {
    // TODO: update search scope to NSMetadataQueryUbiquitousDataScope when saving backups outside of /Documents directory
    backupsQuery.searchScopes = [NSMetadataQueryUbiquitousDocumentsScope]
    // Fetch all JSON files in iCloud container
    backupsQuery.predicate =
    NSPredicate(format: "%K LIKE %@", NSMetadataItemFSNameKey, "*.json")
    
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(backupsMetadataDidChange),
                                           name: .NSMetadataQueryDidFinishGathering,
                                           object: nil)
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(backupsMetadataDidChange),
                                           name: .NSMetadataQueryDidUpdate,
                                           object: nil)
    
    DispatchQueue.main.async {
      self.backupsQuery.start()
    }
  }
  
  /**
   Stops listening to updates from the NSMetadataQuery
   */
  @objc
  func stopFetchingICloudBackups() {
    NotificationCenter.default.removeObserver(self)
    self.backupsQuery.stop()
  }
  
  /**
   Handles any updates to discovered backup files from the NSMetadataQuery. Downloads backup files from iCloud if they are not found locally and sends discovered backups' metadata to JS.
   */
  @objc func backupsMetadataDidChange() {
    self.backupsQuery.disableUpdates()
    
    self.backupsQuery.enumerateResults { (item: Any, _: Int, _: UnsafeMutablePointer<ObjCBool>) in
      if let metadataItem = item as? NSMetadataItem, let url = metadataItem.value(forAttribute: NSMetadataItemURLKey) as? URL {
        if isMetadataItemDownloaded(item: metadataItem) {
          handleDownloadedBackup(url: url)
        } else {
          try? FileManager.default.startDownloadingUbiquitousItem(at: url)
        }
      }
    }
    
    self.backupsQuery.enableUpdates()
  }
  
  /**
   Decodes a backup JSON file and sends backup metadata to JS via RCTEventEmitter
   
   - parameter url: URL of downloaded backup JSON file
   */
  func handleDownloadedBackup(url: URL) {
    let data = try? Data(contentsOf: url)
    if let backup = try? JSONDecoder().decode(ICloudMnemonicBackup.self, from: data!) {
      sendEvent(withName: ICloudManagerEventType.foundCloudBackup.rawValue, body: ["mnemonicId": backup.mnemonicId, "isPinEncrypted": backup.isPinEncrypted, "createdAt": backup.createdAt ])
    } else {
      print("Error decoding iCloud backup JSON at \(url)")
    }
  }
  
  /**
   Determines if an iCloud Documents file discovered from NSMetadataQuery exists locally.
   
   - parameter item: NSMetadataItem that represents a file found in iCloud Documents
   - returns: boolean for whether the file is downloaded from iCloud yet
   */
  func isMetadataItemDownloaded(item : NSMetadataItem) -> Bool {
    if item.value(forAttribute: NSMetadataUbiquitousItemDownloadingStatusKey) as? String == NSMetadataUbiquitousItemDownloadingStatusCurrent {
      return true
    } else {
      return false
    }
  }
}
