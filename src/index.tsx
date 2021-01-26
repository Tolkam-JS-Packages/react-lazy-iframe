import * as React from 'react';
import { PureComponent, SyntheticEvent } from 'react';
import { omit } from '@tolkam/lib-utils';
import { classNames } from '@tolkam/lib-utils-ui';
import InView, { IOffset, IVisibility, TStopFn } from '@tolkam/react-in-view';

const STATUS_MOUNT = 'mount';
const STATUS_BUSY = 'busy';
const STATUS_LOAD = 'load';
const STATUS_ERROR = 'error';

class Iframe extends PureComponent<IProps, IState> {

    /**
     * Loading statuses
     * @var {number}
     */
    public static STATUS_MOUNT = STATUS_MOUNT;
    public static STATUS_BUSY = STATUS_BUSY;
    public static STATUS_LOAD = STATUS_LOAD;
    public static STATUS_ERROR = STATUS_ERROR;

    /**
     * @type IProps
     */
    public static defaultProps = {
        lazy: true,
        withStatusClasses: true,
    };

    /**
     * @type IState
     */
    public state = {
        status: STATUS_MOUNT,
        src: '',
    };

    /**
     * @inheritDoc
     */
    public render() {
        const that = this;
        const { props, state, onFrameChanges } = that;
        const { lazy, className } = props;
        const status = state.status;
        let statusClassName;

        if (props.withStatusClasses && lazy) {
            statusClassName = (props.statusClassPrefix || (className ? className + '--' : '')) + 'status-' + status;
        }

        const frameProps: any = omit({
                ...props,
                frameBorder: 0,
                width: '100%',
                height: 'auto',
                src: lazy ? state.src : props.src,
                className: classNames(className, statusClassName),
            },
            ['lazy', 'lazyParent', 'noParentAutodetect', 'lazyOffset', 'withStatusClasses', 'statusClassPrefix', 'onChanges']);

        const element = <iframe {...frameProps} onLoad={onFrameChanges} onError={onFrameChanges} />;

        return !lazy ? element : <InView
            parent={props.lazyParent}
            parentAutodetect={!props.noParentAutodetect}
            offset={props.lazyOffset}
            onChanges={that.onLazyChanges}
            noClasses
        >{element}</InView>;
    }

    /**
     * Handles iframe loading states
     *
     * @param e
     */
    protected onFrameChanges = (e: SyntheticEvent<HTMLIFrameElement>) => {
        this.update(e.type === 'load' ? STATUS_LOAD : STATUS_ERROR);
    };

    /**
     * Tracks iframe visibility changes
     *
     * @param v
     * @param stop
     */
    protected onLazyChanges = (v: IVisibility, stop: TStopFn) => {
        if(v.visible) {
            this.update(STATUS_BUSY, this.props.src);
            stop();
        }
    };

    /**
     * Handles component updates
     *
     * @param status
     * @param src
     */
    protected update(status: string, src?: string) {
        const props = this.props;
        const onChanges = props.onChanges;

        const state: any = { status };
        if(src) {
            state.src = src;
        }

        this.setState(state, () => {
            onChanges && onChanges(status);
        });
    }
}

export interface IProps extends React.HTMLAttributes<HTMLIFrameElement> {
    src: string,

    // lazy load
    lazy?: boolean,

    // parent to track visibility from
    lazyParent?: HTMLElement;

    // disable autodetect of closest scrolling parent
    noParentAutodetect?: boolean;

    // offset before image element becomes visible
    lazyOffset?: IOffset;

    // enable status classes
    withStatusClasses?: boolean;

    // status class prefix
    statusClassPrefix?: string;

    // callback on status changes
    onChanges?: (status: string) => void;
}

interface IState {
    status: string,
    src: string,
}

export default Iframe;
