import { motion } from 'motion/react'

interface BlurTextProps {
  text: string
  className?: string
}

export function BlurText({ text, className = '' }: BlurTextProps) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((character, index) => (
        <motion.span
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, filter: 'blur(12px)', y: 30 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 + index * 0.045, ease: [0.16, 1, 0.3, 1] }}
          key={`${character}-${index}`}
        >
          {character === ' ' ? '\u00A0' : character}
        </motion.span>
      ))}
    </span>
  )
}
