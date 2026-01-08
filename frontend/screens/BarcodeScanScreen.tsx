import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {ScanMode, ScannedItem} from '@/types/inventory';
import {ScanConfirmation} from '@/components/ScanConfirmation';
import {colors} from '@/styles/colors';
import {spacing, touchTarget, fontSize} from '@/styles/spacing';
import inventoryAPI from '@/services/inventory-api';

export const BarcodeScanScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  // Track last scanned barcode to prevent duplicates
  const lastScannedRef = useRef<string | null>(null);

  const device = useCameraDevice('back');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128', 'code-39', 'upc-a', 'upc-e'],
    onCodeScanned: codes => {
      if (codes.length > 0 && mode) {
        const barcode = codes[0].value;

        if (barcode) {
          // Only scan if it's a new barcode (not the last scanned one)
          if (barcode !== lastScannedRef.current) {
            lastScannedRef.current = barcode;
            handleBarcodeScan(barcode);
          }
        }
      } else {
        // Reset when no barcode in frame
        lastScannedRef.current = null;
      }
    },
  });

  const handleBarcodeScan = async (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    Vibration.vibrate(50); // Haptic feedback

    // Lookup item in API
    try {
      const item = await inventoryAPI.getItemBySku(barcode);
      console.log('Item lookup by sku', item);

      if (!item) {
        // Item not found in inventory
        Alert.alert(
          'Item Not Found',
          `Product ${barcode} is not in the inventory system.`,
        );
        return;
      }

      // Check if already scanned - if so, ignore (user will manually update count)
      setScannedItems(prev => {
        const existing = prev.find(i => i.barcode === barcode);
        if (existing) {
          // Already in list - don't add again, user will update count manually
          Alert.alert('Already Scanned', `${item.item_name} is already in the list. Update the count manually.`);
          return prev;
        }
        // Add new item with count of 1
        return [
          ...prev,
          {
            barcode,
            name: item.item_name,
            count: 1,
            apiId: item.id,
            currentQuantity: item.quantity,
            expirationDate: item.expiration_date,
          },
        ];
      });
    } catch (error) {
      console.error('Error looking up barcode:', error);
      Alert.alert('Error', 'Failed to lookup item. Please try again.');
    }
  };

  const startScanning = (scanMode: ScanMode) => {
    setMode(scanMode);
    setScannedItems([]);
    setIsActive(true);
    // Reset ref when starting new scan session
    lastScannedRef.current = null;
  };

  const handleConfirm = async () => {
    if (scannedItems.length === 0) return;

    try {
      // Prepare updates for batch API call
      const updates = scannedItems.map(item => {
        const delta = mode === 'add' ? item.count : -item.count;
        const newQuantity = (item.currentQuantity || 0) + delta;

        return {
          id: item.apiId!,
          quantity: Math.max(0, newQuantity), // Prevent negative quantities
        };
      });

      // Batch update (parallel PUT requests)
      const {success, errors} = await inventoryAPI.batchUpdateInventory(updates);

      if (errors.length > 0) {
        console.error('Some updates failed:', errors);
        Alert.alert(
          'Partial Success',
          `${success.length} items updated. ${errors.length} failed.`,
        );
      } else {
        Alert.alert(
          'Success',
          `${mode === 'add' ? 'Added' : 'Used'} ${scannedItems.length} item${scannedItems.length === 1 ? '' : 's'}.`,
        );
      }

      // Reset state
      setScannedItems([]);
      setIsActive(false);
      setMode(null);
    } catch (error) {
      console.error('Confirm error:', error);
      Alert.alert('Error', 'Failed to update inventory. Please try again.');
    }
  };

  const handleClear = () => {
    setScannedItems([]);
  };

  const handleCancel = () => {
    setScannedItems([]);
    setIsActive(false);
    setMode(null);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  if (!isActive) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Scan Medical Supplies</Text>
        <Text style={styles.description}>
          Choose an action to start scanning barcodes
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.modeButton, styles.addButton]}
            onPress={() => startScanning('add')}
            accessible={true}
            accessibilityLabel="Add stock - scan barcodes to add supplies to inventory"
            accessibilityRole="button">
            <Text style={styles.modeButtonText}>+ Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, styles.useButton]}
            onPress={() => startScanning('use')}
            accessible={true}
            accessibilityLabel="Use supply - scan barcodes to remove supplies from inventory"
            accessibilityRole="button">
            <Text style={styles.modeButtonText}>- Use Supply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
        // torch='on' 
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {mode === 'add' ? 'Adding Stock' : 'Using Supply'}
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            accessible={true}
            accessibilityLabel="Cancel scanning"
            accessibilityRole="button">
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanInstruction}>
            Point camera at barcode to scan
          </Text>
        </View>
      </View>

      <ScanConfirmation
        items={scannedItems}
        mode={mode!}
        onConfirm={handleConfirm}
        onClear={handleClear}
        onEdit={(barcode, count) => {
          setScannedItems(prev =>
            prev.map(item =>
              item.barcode === barcode ? {...item, count} : item,
            ),
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.large,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  modeButton: {
    height: touchTarget.large,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.success,
  },
  useButton: {
    backgroundColor: colors.danger,
  },
  modeButtonText: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  permissionText: {
    fontSize: fontSize.large,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerText: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelButtonText: {
    fontSize: fontSize.large,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: colors.textOnPrimary,
    borderRadius: 12,
  },
  scanInstruction: {
    fontSize: fontSize.large,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
});
