import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const FixbeeAlertContext = createContext(null);

export function FixbeeAlertProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const showAlert = useCallback((title, message, buttons = [], options = {}) => {
    const alertButtons = buttons.length ? buttons : [{ text: 'OK' }];
    setDialog({ title, message, buttons: alertButtons, options });
  }, []);

  const closeWithButton = useCallback((button) => {
    setDialog(null);
    if (button?.onPress) button.onPress();
  }, []);

  const closeFromBack = useCallback(() => {
    if (!dialog?.options?.cancelable) return;
    const cancelButton = dialog.buttons.find((button) => button.style === 'cancel');
    if (cancelButton) {
      closeWithButton(cancelButton);
    } else {
      setDialog(null);
    }
  }, [dialog, closeWithButton]);

  return (
    <FixbeeAlertContext.Provider value={showAlert}>
      {children}
      <Modal
        visible={Boolean(dialog)}
        transparent
        animationType="fade"
        onRequestClose={closeFromBack}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          {dialog && (
            <View
              style={styles.dialog}
              accessibilityViewIsModal
              accessibilityRole="alert"
            >
              <View style={styles.heading}>
                <View style={[
                  styles.iconBadge,
                  dialog.buttons.some((button) => button.style === 'destructive')
                    && styles.destructiveIconBadge,
                ]}>
                  <Ionicons
                    name={dialog.buttons.some((button) => button.style === 'destructive')
                      ? 'warning-outline'
                      : 'information'}
                    size={20}
                    color={dialog.buttons.some((button) => button.style === 'destructive')
                      ? Colors.accentDanger
                      : Colors.primary}
                  />
                </View>
                <Text style={styles.title}>{dialog.title}</Text>
              </View>

              {dialog.message ? (
                <ScrollView
                  style={styles.messageScroll}
                  showsVerticalScrollIndicator
                  contentContainerStyle={styles.messageContent}
                >
                  <Text style={styles.message}>{dialog.message}</Text>
                </ScrollView>
              ) : null}

              <View style={[
                styles.actions,
                dialog.buttons.length > 1 && styles.multipleActions,
              ]}>
                {dialog.buttons.map((button, index) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';
                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={button.text}
                      onPress={() => closeWithButton(button)}
                      style={({ pressed }) => [
                        styles.action,
                        isCancel && styles.cancelAction,
                        isDestructive && styles.destructiveAction,
                        pressed && styles.actionPressed,
                      ]}
                    >
                      <Text style={[
                        styles.actionText,
                        isCancel && styles.cancelActionText,
                        isDestructive && styles.destructiveActionText,
                      ]}>
                        {button.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </FixbeeAlertContext.Provider>
  );
}

export function useFixbeeAlert() {
  const context = useContext(FixbeeAlertContext);
  if (!context) {
    throw new Error('useFixbeeAlert must be used within FixbeeAlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCardElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
  },
  destructiveIconBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  messageScroll: {
    flexShrink: 1,
    marginBottom: 20,
  },
  messageContent: {
    flexGrow: 1,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  multipleActions: {
    flexWrap: 'wrap',
  },
  action: {
    minHeight: 44,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  cancelAction: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  destructiveAction: {
    backgroundColor: Colors.accentDanger,
  },
  actionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
  cancelActionText: {
    color: Colors.textSecondary,
  },
  destructiveActionText: {
    color: Colors.textPrimary,
  },
});
