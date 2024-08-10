import { useEffect, useRef, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

import styles from '@styles/Accordion.module.scss'

const AccordionItem = ({ title, content }) => {
	const [isActive, setIsActive] = useState(false)
	const [height, setHeight] = useState(0)
	const ref = useRef(null)

	useEffect(() => {
		setHeight(ref.current.scrollHeight)
	}, [isActive])

	return (
		<div className='rounded-md my-2 border-2 border-slate-500/10'>
			<div
				className={`bg-[#FAFAFA] dark:bg-zinc-900/60 w-full flex justify-between p-5 md:p-6 transition-all cursor-pointer ${
					isActive ? 'bg-transparent' : ''
				}`}
				onClick={() => setIsActive(!isActive)}
			>
				<h4 className={styles.button__heading}>{title}</h4>
				<span className={styles.button__heading}>
					{
						<PlusOutlined
							style={{
								transition: '0.3s !important',
								transform: isActive ? 'rotate(45deg)' : 'rotate(0deg)'
							}}
						/>
					}
				</span>
			</div>
			<div
				ref={ref}
				className={styles.panel}
				style={isActive ? { maxHeight: `${height}px` } : { maxHeight: '0' }}
			>
				<p
					className='mx-5 md:mx-6 mt-4 mb-6 text-sm md:text-base transition'
					style={{ opacity: isActive ? 1 : 0 }}
				>
					{content}
				</p>
			</div>
		</div>
	)
}
