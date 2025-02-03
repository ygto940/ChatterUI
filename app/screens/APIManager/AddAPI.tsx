import HeartbeatButton from '@components/buttons/HeartbeatButton'
import ThemedButton from '@components/buttons/ThemedButton'
import DropdownSheet from '@components/input/DropdownSheet'
import MultiDropdownSheet from '@components/input/MultiDropdownSheet'
import ThemedTextInput from '@components/input/ThemedTextInput'
import { APIManagerValue, APIState } from '@lib/engine/API/APIManagerState'
import claudeModels from '@lib/engine/API/ClaudeModels.json'
import { Theme } from '@lib/theme/ThemeManager'
import { Logger } from '@lib/utils/Global'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

const AddAPI = () => {
    const styles = useStyles()
    const router = useRouter()
    const { addValue, getTemplates } = APIState.useAPIState((state) => ({
        getTemplates: state.getTemplates,
        addValue: state.addValue,
    }))

    const [template, setTemplate] = useState(getTemplates()[0])
    const [values, setValues] = useState<APIManagerValue>({
        ...template.defaultValues,
        configName: template.name,
        friendlyName: 'New API',
        active: true,
    })
    const [modelList, setModelList] = useState<any[]>([])

    const handleGetModelList = async () => {
        if (!template.features.useModel) return
        if (template.defaultValues.modelEndpoint === '{{CLAUDE}}') {
            setModelList(claudeModels.models)
            return
        }
        let auth: any = {}
        if (template.features.useKey) {
            auth = { [template.request.authHeader]: template.request.authPrefix + values.key }
        }
        const result = await fetch(values.modelEndpoint, { headers: { ...auth } })
        const data = await result.json()
        if (result.status !== 200) {
            Logger.log(`Could not retrieve models: ${data?.error?.message}`)
            return
        }
        const models = getNestedValue(data, template.model.modelListParser)
        setModelList(models)
    }

    useEffect(() => {
        handleGetModelList()
    }, [template])

    return (
        <View style={styles.mainContainer}>
            <Stack.Screen options={{ title: 'Add Connection' }} />
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ rowGap: 16, paddingBottom: 24 }}>
                <DropdownSheet
                    style={{ marginBottom: 8 }}
                    data={getTemplates()}
                    labelExtractor={(template) => template.name}
                    selected={template}
                    onChangeValue={(item) => {
                        setTemplate(item)
                        setValues({
                            ...item.defaultValues,
                            friendlyName: values.friendlyName,
                            active: true,
                            configName: item.name,
                        })
                    }}
                    modalTitle="Select Connection Type"
                    search
                />

                <ThemedTextInput
                    label="Friendly Name"
                    value={values.friendlyName}
                    onChangeText={(value) => {
                        setValues({ ...values, friendlyName: value })
                    }}
                />

                {template.ui.editableCompletionPath && (
                    <View>
                        <ThemedTextInput
                            label="Completion URL"
                            value={values.endpoint}
                            onChangeText={(value) => {
                                setValues({ ...values, endpoint: value })
                            }}
                        />
                        <Text style={styles.hintText}>Note: Use full URL path</Text>
                    </View>
                )}

                {template.ui.editableModelPath && (
                    <View>
                        <ThemedTextInput
                            label="Model URL"
                            value={values.modelEndpoint}
                            onChangeText={(value) => {
                                setValues({ ...values, modelEndpoint: value })
                            }}
                        />
                        <HeartbeatButton
                            api={values.modelEndpoint ?? ''}
                            apiFormat={(s) => s}
                            headers={
                                template.features.useKey
                                    ? {
                                          [template.request.authHeader]:
                                              template.request.authPrefix + values.key,
                                      }
                                    : {}
                            }
                            callback={handleGetModelList}
                        />
                    </View>
                )}

                {template.features.useKey && (
                    <ThemedTextInput
                        label="API Key"
                        value={values.key}
                        onChangeText={(value) => {
                            setValues({ ...values, key: value })
                        }}
                    />
                )}

                {template.features.useModel && (
                    <View>
                        <Text style={styles.title}>Model</Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                columnGap: 8,
                                marginTop: 8,
                            }}>
                            {!template.features.multipleModels && (
                                <DropdownSheet
                                    containerStyle={{ flex: 1 }}
                                    selected={values.model}
                                    data={modelList}
                                    labelExtractor={(value) => {
                                        return getNestedValue(value, template.model.nameParser)
                                    }}
                                    onChangeValue={(item) => {
                                        setValues({ ...values, model: item })
                                    }}
                                    search={modelList.length > 10}
                                    modalTitle="Select Model"
                                />
                            )}
                            {template.features.multipleModels && (
                                <MultiDropdownSheet
                                    containerStyle={{ flex: 1 }}
                                    selected={values?.model ?? []}
                                    data={modelList}
                                    labelExtractor={(value) => {
                                        return getNestedValue(value, template.model.nameParser)
                                    }}
                                    onChangeValue={(item) => {
                                        setValues({ ...values, model: item })
                                    }}
                                    search={modelList.length > 10}
                                    modalTitle="Select Model"
                                />
                            )}
                            <ThemedButton
                                onPress={() => {
                                    handleGetModelList()
                                }}
                                iconName="reload1"
                                iconSize={18}
                                variant="secondary"
                            />
                        </View>
                    </View>
                )}

                {template.features.useFirstMessage && (
                    <View>
                        <ThemedTextInput
                            label="First Message"
                            value={values.firstMessage}
                            onChangeText={(value) => {
                                setValues({ ...values, firstMessage: value })
                            }}
                        />
                        <Text style={styles.hintText}>Default first message sent to Claude</Text>
                    </View>
                )}
                {template.features.usePrefill && (
                    <View>
                        <ThemedTextInput
                            label="Prefill"
                            value={values.prefill}
                            onChangeText={(value) => {
                                setValues({ ...values, prefill: value })
                            }}
                        />
                        <Text style={styles.hintText}>Leave blank to use default endpoint</Text>
                    </View>
                )}
            </ScrollView>
            <ThemedButton
                label="Create API"
                onPress={() => {
                    addValue(values)
                    router.back()
                }}
            />
        </View>
    )
}

export default AddAPI

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()
    return StyleSheet.create({
        mainContainer: {
            marginVertical: spacing.xl,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.xl,
            flex: 1,
        },

        title: {
            paddingTop: spacing.m,
            color: color.text._100,
            fontSize: spacing.xl,
        },

        hintText: {
            marginTop: spacing.s,
            color: color.text._400,
        },

        modelInfo: {
            borderRadius: spacing.m,
            backgroundColor: color.neutral._200,
            flex: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.l,
            paddingBottom: spacing.xl2,
        },
    })
}

const getNestedValue = (obj: any, path: string) => {
    if (path === '') return obj
    const keys = path.split('.')
    const value = keys.reduce((acc, key) => acc?.[key], obj)
    return value ?? null
}
