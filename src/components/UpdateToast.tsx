import { ArrowDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

interface UpdateToastProps {
  visible: boolean
}

export function UpdateToast({ visible }: UpdateToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          className="update-toast liquid-glass-strong"
          href="#bill"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.28 }}
        >
          <span>账单已更新</span>
          <strong>查看结果 <ArrowDown size={14} /></strong>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
