import { Logger } from '@lib/state/Logger'
import { mmkvStorage } from '@lib/storage/MMKV'
import { setBackgroundColorAsync } from 'expo-system-ui'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { ThemeColor, DefaultColorSchemes, themeColorSchemaV1 } from './ThemeColor'

interface ColorStateProps {
    customColors: ThemeColor[]
    addCustomColor: (colorScheme: ThemeColor) => void
    removeColorScheme: (index: number) => void
    color: ThemeColor
    setColor: (colorScheme: ThemeColor) => void
}

export const useGlobalStyles = () => {
    // todo: find common items to add here
    const { color, spacing, borderWidth, borderRadius } = Theme.useTheme()
}

export namespace Theme {
    export const useColorState = create<ColorStateProps>()(
        persist(
            (set, get) => ({
                color: DefaultColorSchemes.lavenderDark,
                setColor: (color) => {
                    setBackgroundColorAsync(color.neutral._100)
                    set((state) => ({ ...state, color: color }))
                },
                customColors: [],
                addCustomColor: (colorScheme: ThemeColor) => {
                    const validation = themeColorSchemaV1.safeParse(colorScheme)

                    if (!validation.success) {
                        Logger.log(`Schema validation failed!`, true)
                        Logger.log(
                            'The format of the imported JSON does not match the required color scheme:\n' +
                                validation.error.issues
                                    .map((issue) => `${issue.path.join('.')} - ${issue.message}`)
                                    .join('\n')
                        )
                        return
                    }

                    if (
                        get().customColors.some((item) => item.name === colorScheme.name) ||
                        DefaultColorSchemes.schemes.some((item) => item.name === colorScheme.name)
                    ) {
                        Logger.log('Color Name Already Used')
                        return
                    }
                    set((state) => ({
                        ...state,
                        customColors: [...get().customColors, colorScheme],
                    }))
                    Logger.log(`Successfully imported ${colorScheme.name}`)
                },
                removeColorScheme: (index: number) => {
                    if (index > get().customColors.length) {
                        return
                    }
                    const colors = [...get().customColors]
                    colors.splice(index, 1)
                    set((state) => ({
                        ...state,
                        customColors: colors,
                    }))
                },
            }),
            {
                name: 'colorscheme-storage',
                storage: createJSONStorage(() => mmkvStorage),
                version: 1,
                partialize: (state) => ({ color: state.color, customColors: state.customColors }),
            }
        )
    )
    // TODO: State-ify
    const useSpacingState = () => {
        const spacing = {
            xs: 2,
            s: 4,
            sm: 6,
            m: 8,
            l: 12,
            xl: 16,
            xl2: 24,
            xl3: 32,
        }
        return spacing
    }

    const useBorderWidthState = () => {
        return {
            s: 1,
            m: 2,
            l: 4,
            xl: 8,
        }
    }

    const useBorderRadiusState = () => {
        return {
            s: 4,
            m: 8,
            l: 12,
            xl: 16,
            xl2: 24,
            xl3: 32,
        }
    }
    // TODO: Research fonts
    const useFontState = () => {
        return ''
    }

    const useFontSize = () => {
        return { s: 12, m: 14, l: 16, xl: 18, xl2: 20, xl3: 24 }
    }

    export const useTheme = () => {
        const color = useColorState((state) => state.color)
        const spacing = useSpacingState()
        const font = useFontState()
        const borderWidth = useBorderWidthState()
        const borderRadius = useBorderRadiusState()
        const fontSize = useFontSize()
        return { color, spacing, font, borderWidth, fontSize, borderRadius }
    }
}
