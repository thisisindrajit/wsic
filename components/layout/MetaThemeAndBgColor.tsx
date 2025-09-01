"use client"

import { useTheme } from "next-themes"
import { useLayoutEffect } from "react"

const MetaThemeAndBgColor = () => {
    const { resolvedTheme } = useTheme()

    useLayoutEffect(() => {
        // Remove existing theme-color and background-color meta tags
        const existingThemeMeta = document.querySelector('meta[name="theme-color"]')
        const existingBgMeta = document.querySelector('meta[name="background-color"]')

        if (existingThemeMeta) {
            existingThemeMeta.remove()
        }
        if (existingBgMeta) {
            existingBgMeta.remove()
        }

        // Create new theme-color meta tag
        const themeMeta = document.createElement('meta')
        themeMeta.name = 'theme-color'

        // Create new background-color meta tag
        const bgMeta = document.createElement('meta')
        bgMeta.name = 'background-color'

        // Set colors based on theme
        if (resolvedTheme === 'dark') {
            // Dark theme background color (oklch(0.145 0 0) converted to hex)
            const darkColor = '#252525'
            themeMeta.content = darkColor
            bgMeta.content = darkColor
        } else {
            // Light theme background color (oklch(1 0 0) converted to hex)
            const lightColor = '#ffffff'
            themeMeta.content = lightColor
            bgMeta.content = lightColor
        }

        document.head.appendChild(themeMeta)
        document.head.appendChild(bgMeta)
    }, [resolvedTheme])

    return null
}

export default MetaThemeAndBgColor